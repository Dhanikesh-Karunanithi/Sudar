<?php
require_once(__DIR__ . '/../../config.php');

use local_sudaralp\local\client;
use local_sudaralp\local\identity;

require_login();

$mode = optional_param('mode', 'play', PARAM_ALPHA);
if (!in_array($mode, ['play', 'author'], true)) {
    $mode = 'play';
}
$scenarioid = optional_param('scenario_id', '', PARAM_RAW_TRIMMED);

$capability = $mode === 'author' ? 'local/sudaralp:launchsim_author' : 'local/sudaralp:launchsim_play';
require_capability($capability, context_system::instance());

$PAGE->set_context(context_system::instance());
$PAGE->set_url(new moodle_url('/local/sudaralp/sim.php', ['mode' => $mode]));
$PAGE->set_title(get_string('simtitle', 'local_sudaralp'));
$PAGE->set_heading(get_string('simtitle', 'local_sudaralp'));

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

$res = $alp->sim_embed_token($sudaruserid, $mode, $scenarioid !== '' ? $scenarioid : null);
if (($res['_status'] ?? 500) >= 400 || empty($res['embed_url'])) {
    echo $OUTPUT->notification(s($res['error'] ?? get_string('simerror', 'local_sudaralp')), 'notifyproblem');
    echo $OUTPUT->footer();
    exit;
}

$embedurl = new moodle_url((string)$res['embed_url']);
echo html_writer::tag('p', get_string('simdesc', 'local_sudaralp'));
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
