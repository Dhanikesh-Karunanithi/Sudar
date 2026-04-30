<?php
namespace local_sudaralp;

defined('MOODLE_INTERNAL') || die();

use local_sudaralp\local\identity;

class observer {
    public static function course_module_completion_updated(\core\event\course_module_completion_updated $event): void {
        if (!get_config('local_sudaralp', 'enableevents')) {
            return;
        }
        global $DB;
        if (get_config('local_sudaralp', 'identityfailclosed')) {
            $sid = identity::resolve_sudar_user_id((int)$event->relateduserid);
            if ($sid === null) {
                return;
            }
        }
        $DB->insert_record('local_sudaralp_q', [
            'userid' => (int)$event->relateduserid,
            'eventtype' => 'module_complete',
            'payloadjson' => json_encode([
                'course_id' => (string)($event->courseid ?? ''),
                'module_id' => (string)($event->contextinstanceid ?? ''),
                'payload' => ['source' => 'moodle_completion'],
            ]),
            'timecreated' => time(),
            'attempt_count' => 0,
            'next_attempt_at' => 0,
            'last_error' => null,
            'status' => 'pending',
        ]);
    }

    public static function quiz_attempt_submitted(\mod_quiz\event\attempt_submitted $event): void {
        if (!get_config('local_sudaralp', 'enableevents')) {
            return;
        }
        global $DB;
        if (get_config('local_sudaralp', 'identityfailclosed')) {
            $sid = identity::resolve_sudar_user_id((int)$event->userid);
            if ($sid === null) {
                return;
            }
        }
        $DB->insert_record('local_sudaralp_q', [
            'userid' => (int)$event->userid,
            'eventtype' => 'quiz_attempt',
            'payloadjson' => json_encode([
                'course_id' => (string)($event->courseid ?? ''),
                'module_id' => (string)($event->contextinstanceid ?? ''),
                'payload' => ['source' => 'moodle_quiz_submit'],
            ]),
            'timecreated' => time(),
            'attempt_count' => 0,
            'next_attempt_at' => 0,
            'last_error' => null,
            'status' => 'pending',
        ]);
    }
}
