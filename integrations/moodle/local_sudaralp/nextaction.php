<?php
require_once(__DIR__ . '/../../config.php');

use local_sudaralp\local\client;
use local_sudaralp\local\identity;

require_login();

$courseid = optional_param('courseid', null, PARAM_INT);
if ($courseid) {
    $context = context_course::instance($courseid);
    require_capability('local/sudaralp:nextaction_course', $context);
} else {
    $context = context_user::instance($USER->id);
    require_capability('local/sudaralp:nextaction_dashboard', $context);
}

$PAGE->set_context($context);
$PAGE->set_url(new moodle_url('/local/sudaralp/nextaction.php', $courseid ? ['courseid' => $courseid] : []));
$PAGE->set_title(get_string('nextaction', 'local_sudaralp'));
$PAGE->set_heading(get_string('nextaction', 'local_sudaralp'));

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

$res = $alp->next_action($sudaruserid);
if (($res['_status'] ?? 500) >= 400) {
    echo $OUTPUT->notification(s($res['error'] ?? 'ALP request failed'), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$actiontype = s((string)($res['action_type'] ?? 'continue_course'));
$reason = s((string)($res['reason'] ?? 'Continue your learning.'));
$confidence = s((string)($res['confidence'] ?? '0.5'));

echo html_writer::tag('h3', 'Sudar recommendation');
echo html_writer::tag('p', 'Action: ' . $actiontype);
echo html_writer::tag('p', 'Reason: ' . $reason);
echo html_writer::tag('p', 'Confidence: ' . $confidence);

echo $OUTPUT->footer();
