<?php
defined('MOODLE_INTERNAL') || die();

/**
 * Dashboard / course block: Sudar next action + tutor launch (requires local_sudaralp).
 */
class block_sudaralp extends block_base {
    public function init(): void {
        $this->title = get_string('pluginname', 'block_sudaralp');
    }

    public function applicable_formats(): array {
        return [
            'site-index' => true,
            'course-view' => true,
            'my' => true,
        ];
    }

    public function get_content() {
        global $USER;

        if ($this->content !== null) {
            return $this->content;
        }

        $this->content = new stdClass();
        $this->content->footer = '';
        $this->content->text = '';

        if (!isloggedin() || isguestuser()) {
            return $this->content;
        }

        $ctx = $this->page->context;
        $courseid = null;

        if ($ctx->contextlevel == CONTEXT_COURSE) {
            if (!has_capability('local/sudaralp:nextaction_course', $ctx)) {
                return $this->content;
            }
            $courseid = (int)$this->page->course->id;
        } else if ($ctx->contextlevel == CONTEXT_USER) {
            if (!has_capability('local/sudaralp:nextaction_dashboard', $ctx)) {
                return $this->content;
            }
        } else {
            return $this->content;
        }

        $canlaunch = false;
        if ($courseid) {
            $cctx = context_course::instance($courseid);
            $canlaunch = has_capability('local/sudaralp:launchtutor_course', $cctx);
        } else {
            $canlaunch = has_capability('local/sudaralp:launchtutor_dashboard', context_user::instance($USER->id));
        }

        $nextparams = $courseid ? ['courseid' => $courseid] : [];
        $nexturl = new moodle_url('/local/sudaralp/nextaction.php', $nextparams);
        $tutorurl = new moodle_url('/local/sudaralp/tutor.php', $nextparams);

        $lis = [];
        $lis[] = html_writer::tag('li', html_writer::link($nexturl, get_string('nextaction', 'local_sudaralp')));
        if ($canlaunch) {
            $lis[] = html_writer::tag('li', html_writer::link($tutorurl, get_string('openchat', 'local_sudaralp')));
        }
        $this->content->text = html_writer::tag('ul', implode('', $lis));
        return $this->content;
    }
}
