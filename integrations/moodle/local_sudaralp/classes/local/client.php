<?php
namespace local_sudaralp\local;

defined('MOODLE_INTERNAL') || die();

class client {
    private string $baseurl;
    private string $apikey;

    public function __construct() {
        $this->baseurl = rtrim((string)get_config('local_sudaralp', 'learnbaseurl'), '/');
        $this->apikey = (string)get_config('local_sudaralp', 'apikey');
    }

    public function configured(): bool {
        return $this->baseurl !== '' && $this->apikey !== '';
    }

    public function post(string $path, array $body): array {
        $url = $this->baseurl . $path;
        $headers = [
            'Content-Type: application/json',
            'x-alp-api-key: ' . $this->apikey,
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

        $raw = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode((string)$raw, true);
        if (!is_array($json)) {
            $json = ['error' => 'Invalid JSON response', 'status' => $code];
        }
        $json['_status'] = $code;
        return $json;
    }

    public function send_events(string $userid, array $events): array {
        return $this->post('/api/alp/events', [
            'user_id' => $userid,
            'events' => $events,
        ]);
    }

    public function next_action(string $userid): array {
        return $this->post('/api/alp/next-action', [
            'user_id' => $userid,
        ]);
    }

    public function embed_token(string $userid, ?string $courseid = null, ?string $moduleid = null): array {
        return $this->post('/api/alp/embed-token', [
            'user_id' => $userid,
            'course_id' => $courseid,
            'module_id' => $moduleid,
        ]);
    }

    public function create_embed_token(string $creatoruserid, string $tool = 'quiz'): array {
        return $this->post('/api/alp/create/embed-token', [
            'creator_user_id' => $creatoruserid,
            'tool' => $tool,
        ]);
    }

    public function sim_embed_token(string $userid, string $mode = 'play', ?string $scenarioid = null): array {
        $body = [
            'user_id' => $userid,
            'mode' => $mode,
        ];
        if ($scenarioid !== null) {
            $body['scenario_id'] = $scenarioid;
        }
        return $this->post('/api/alp/sim/embed-token', $body);
    }
}
