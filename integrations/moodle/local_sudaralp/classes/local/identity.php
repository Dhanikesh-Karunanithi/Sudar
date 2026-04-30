<?php
namespace local_sudaralp\local;

defined('MOODLE_INTERNAL') || die();

/**
 * Resolves Moodle internal user id to Sudar profiles.id via Learn /api/alp/identity/resolve.
 */
class identity {
    /**
     * @param int $moodleuserid Moodle user.id
     * @return string|null Sudar UUID or null if unmapped / misconfigured
     */
    public static function resolve_sudar_user_id(int $moodleuserid): ?string {
        static $memory = [];

        if (isset($memory[$moodleuserid])) {
            return $memory[$moodleuserid];
        }

        $cache = \cache::make('local_sudaralp', 'sudaridentity');
        $key = (string)$moodleuserid;
        $cached = $cache->get($key);
        if ($cached !== false) {
            $memory[$moodleuserid] = $cached;
            return $cached;
        }

        $client = new client();
        if (!$client->configured()) {
            return null;
        }

        $provider = (string)get_config('local_sudaralp', 'identityprovider');
        if ($provider === '') {
            $provider = 'moodle';
        }

        $res = $client->post('/api/alp/identity/resolve', [
            'provider' => $provider,
            'external_user_id' => (string)$moodleuserid,
        ]);

        $status = (int)($res['_status'] ?? 500);
        if ($status >= 200 && $status < 300 && !empty($res['sudar_user_id'])) {
            $ttl = (int)get_config('local_sudaralp', 'identitycachettl');
            if ($ttl < 60) {
                $ttl = 3600;
            }
            $cache->set($key, $res['sudar_user_id'], $ttl);
            $memory[$moodleuserid] = $res['sudar_user_id'];
            return $res['sudar_user_id'];
        }

        return null;
    }
}
