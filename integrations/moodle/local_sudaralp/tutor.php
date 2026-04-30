<?php
require_once(__DIR__ . '/../../config.php');

use local_sudaralp\local\client;
use local_sudaralp\local\identity;

require_login();

$courseid = optional_param('courseid', null, PARAM_INT);
$cmid = optional_param('cmid', null, PARAM_INT);

if ($courseid) {
    $context = context_course::instance($courseid);
    require_capability('local/sudaralp:launchtutor_course', $context);
} else {
    $context = context_user::instance($USER->id);
    require_capability('local/sudaralp:launchtutor_dashboard', $context);
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/sudaralp/tutor.php', array_filter([
    'courseid' => $courseid,
    'cmid' => $cmid,
])));
$PAGE->set_title(get_string('openchat', 'local_sudaralp'));
$PAGE->set_heading(get_string('openchat', 'local_sudaralp'));

$alp = new client();

echo $OUTPUT->header();
if (!$alp->configured()) {
    echo $OUTPUT->notification(get_string('errorsetting', 'local_sudaralp'), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$sudaruserid = identity::resolve_sudar_user_id((int)$USER->id);
if ($sudaruserid === null) {
    echo $OUTPUT->notification(get_string('identitymissing', 'local_sudaralp'), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$res = $alp->embed_token($sudaruserid, $courseid ? (string)$courseid : null, $cmid ? (string)$cmid : null);
if (($res['_status'] ?? 500) >= 400 || empty($res['embed_url'])) {
    echo $OUTPUT->notification(s($res['error'] ?? 'Failed to create embed token.'), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$embedurl = new moodle_url((string)$res['embed_url']);
echo html_writer::tag('p', 'Sudar tutor (ALP embed token flow)');
echo html_writer::start_tag('iframe', [
    'src' => $embedurl->out(false),
    'width' => '100%',
    'height' => '720',
    'style' => 'border:1px solid #ccc;border-radius:8px;',
    'loading' => 'lazy',
    'referrerpolicy' => 'no-referrer',
]);
echo html_writer::end_tag('iframe');

echo $OUTPUT->footer();
