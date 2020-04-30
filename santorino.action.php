<?php
/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * santorino implementation : 
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * santorino.action.php
 *
 * santorino main action entry point
 *
 *
 * In this file, you are describing all the methods that can be called from your
 * user interface logic (javascript).
 *
 * If you define a method "myAction" here, then you can call it from your javascript code with:
 * this.ajaxcall( "/santorino/santorino/myAction.html", ...)
 *
 */


class action_santorino extends APP_GameAction
{
    // Constructor: please do not modify
    public function __default()
    {
        if (self::isArg('notifwindow')) {
            $this->view = 'common_notifwindow';
            $this->viewArgs['table'] = self::getArg('table', AT_posint, true);
        } else {
            $this->view = 'santorini_santorini';
            self::trace('Complete reinitialization of board game');
        }
    }

    public function place()
    {
        self::setAjaxMode();
        $x = (int) self::getArg('x', AT_int, true);
        $y = (int) self::getArg('y', AT_int, true);
        $z = (int) self::getArg('z', AT_posint, true);
        $this->game->place($x, $y, $z);
        self::ajaxResponse();
    }

    public function move()
    {
        self::setAjaxMode();
        $x = (int) self::getArg('x', AT_int, true);
        $y = (int) self::getArg('y', AT_int, true);
        $z = (int) self::getArg('z', AT_posint, true);
        $worker_id = (int) self::getArg('worker_id', AT_posint, true);
        $this->game->move($worker_id, $x, $y, $z);
        self::ajaxResponse();
    }

	public function build()
    {
        self::setAjaxMode();
        $x = (int) self::getArg('x', AT_int, true);
        $y = (int) self::getArg('y', AT_int, true);
        $z = (int) self::getArg('z', AT_posint, true);
        $this->game->build($x, $y, $z);
        self::ajaxResponse();
    }
    
}