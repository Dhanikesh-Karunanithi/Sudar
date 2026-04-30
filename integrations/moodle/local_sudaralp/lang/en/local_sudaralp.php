<?php
defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Sudar ALP connector';
$string['settings'] = 'Sudar ALP settings';
$string['learnbaseurl'] = 'Sudar Learn base URL';
$string['learnbaseurl_desc'] = 'Example: https://learn.example.com';
$string['apikey'] = 'ALP API key';
$string['apikey_desc'] = 'Integration key generated in Sudar Studio Integrations.';
$string['enableevents'] = 'Enable event forwarding';
$string['enableevents_desc'] = 'Queue Moodle completion/quiz events and forward to /api/alp/events.';
$string['queuedtaskname'] = 'Push queued Moodle events to Sudar ALP';
$string['nextaction'] = 'Sudar next action';
$string['openchat'] = 'Open Sudar tutor';
$string['errorsetting'] = 'Sudar ALP is not configured. Ask your admin to set Learn URL and ALP API key.';
$string['identitymissing'] = 'Your Moodle account is not linked to a Sudar learner yet. Ask your admin to map Moodle users via Sudar Studio provisioning (lms_identity_links).';
$string['identityprovider'] = 'Identity provider key';
$string['identityprovider_desc'] = 'Provider string stored in Sudar lms_identity_links (default moodle).';
$string['identitycachettl'] = 'Sudar user id cache TTL';
$string['identitycachettl_desc'] = 'How long to cache Moodle user → Sudar UUID resolution.';
$string['identityfailclosed'] = 'Fail closed on events (no mapping)';
$string['identityfailclosed_desc'] = 'When enabled, Moodle events are not queued unless a Sudar mapping already exists (avoids DLQ noise). When disabled, events queue and move to dead letter if still unmapped.';
