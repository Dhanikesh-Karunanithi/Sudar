<?php
namespace local_sudaralp\task;

defined('MOODLE_INTERNAL') || die();

use core\task\scheduled_task;
use local_sudaralp\local\client;
use local_sudaralp\local\identity;

class push_queue extends scheduled_task {
    private const MAX_ATTEMPTS = 8;

    public function get_name(): string {
        return get_string('queuedtaskname', 'local_sudaralp');
    }

    public function execute(): void {
        global $DB;
        $alp = new client();
        if (!$alp->configured()) {
            return;
        }

        $now = time();
        $rows = $DB->get_records_select(
            'local_sudaralp_q',
            "status = ? AND (next_attempt_at = 0 OR next_attempt_at <= ?)",
            ['pending', $now],
            'id ASC',
            '*',
            0,
            100
        );
        if (!$rows) {
            return;
        }

        foreach ($rows as $row) {
            $this->process_row($row, $alp, $DB);
        }
    }

    /**
     * @param \stdClass $row
     * @param client $alp
     * @param \moodle_database $DB
     */
    private function process_row($row, client $alp, $DB): void {
        $payload = json_decode((string)$row->payloadjson, true);
        if (!is_array($payload)) {
            $this->mark_dead($row, 'invalid_payload_json', $DB, (int)$row->attempt_count);
            return;
        }

        $moodleuserid = (int)$row->userid;
        $sudarid = identity::resolve_sudar_user_id($moodleuserid);
        if ($sudarid === null) {
            $this->mark_dead($row, 'no_sudar_identity_mapping', $DB, (int)$row->attempt_count);
            return;
        }

        $events = [[
            'event_type' => $row->eventtype,
            'course_id' => $payload['course_id'] ?? null,
            'module_id' => $payload['module_id'] ?? null,
            'payload' => $payload['payload'] ?? null,
            'modality' => 'text',
        ]];

        $res = $alp->send_events($sudarid, $events);
        $status = (int)($res['_status'] ?? 500);
        if ($status >= 200 && $status < 300) {
            $DB->delete_records('local_sudaralp_q', ['id' => $row->id]);
            return;
        }

        $msg = is_string($res['error'] ?? null) ? $res['error'] : ('http_' . $status);
        $this->schedule_retry($row, $msg, $DB);
    }

    /**
     * @param \stdClass $row
     * @param string $message
     * @param \moodle_database $DB
     */
    private function schedule_retry($row, string $message, $DB): void {
        $attempts = (int)$row->attempt_count + 1;
        if ($attempts >= self::MAX_ATTEMPTS) {
            $this->mark_dead($row, $message, $DB, $attempts);
            return;
        }
        $delay = min(3600, (int)pow(2, min($attempts, 10)));
        $DB->update_record('local_sudaralp_q', (object)[
            'id' => $row->id,
            'status' => 'pending',
            'attempt_count' => $attempts,
            'next_attempt_at' => time() + $delay,
            'last_error' => substr($message, 0, 1024),
        ]);
    }

    /**
     * @param \stdClass $row
     * @param string $message
     * @param \moodle_database $DB
     */
    private function mark_dead($row, string $message, $DB, ?int $finalattempts = null): void {
        $DB->update_record('local_sudaralp_q', (object)[
            'id' => $row->id,
            'status' => 'dead',
            'attempt_count' => $finalattempts ?? (int)$row->attempt_count,
            'next_attempt_at' => 0,
            'last_error' => substr($message, 0, 1024),
        ]);
    }
}
