<?php
require_once(__DIR__ . '/../../config.php');

use local_sudaralp\local\client;
use local_sudaralp\local\identity;

require_login();
require_capability('local/sudaralp:launchcreate', context_system::instance());

$tool = optional_param('tool', 'quiz', PARAM_ALPHANUMEXT);
$allowed = ['quiz', 'interact', 'cards', 'draft', 'media', 'outline'];
if (!in_array($tool, $allowed, true)) {
    $tool = 'quiz';
}

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/sudaralp/create.php', ['tool' => $tool]));
$PAGE->set_title(get_string('createtitle', 'local_sudaralp'));
$PAGE->set_heading(get_string('createtitle', 'local_sudaralp'));

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

$res = $alp->create_embed_token($sudaruserid, $tool);
if (($res['_status'] ?? 500) >= 400 || empty($res['embed_url'])) {
    echo $OUTPUT->notification(s($res['error'] ?? get_string('createerror', 'local_sudaralp')), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$embedurl = new moodle_url((string)$res['embed_url']);
echo html_writer::tag('p', get_string('createdesc', 'local_sudaralp'));
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
