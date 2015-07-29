package;

import flash.external.ExternalInterface;
import flash.display.MovieClip;
import flash.events.MouseEvent;
import flash.Lib;
import flash.display.Sprite;
import flash.display.StageScaleMode;
import flash.net.URLRequest;
import haxe.Timer;

/**
 * Toolkit-Class for jquery-popunder
 */
class Toolkit extends MovieClip {

    /**
     * construct-wrapper
     */
    public static function main() {
        new Toolkit();
    }

    /**
     * Class constructor
     * - add the external-callback which can be accessed via javascript
     * - execute the 'whenLoaded'-callback
     */
    public function new() {
        super();

        flash.Lib.current.stage.addEventListener(MouseEvent.MOUSE_UP, onMouseUpEvent);
        flash.Lib.current.stage.scaleMode = StageScaleMode.EXACT_FIT;

        ExternalInterface.call("jQuery.popunder.helper.loadfl");
        ExternalInterface.addCallback("dispatchEventMouseClick", dispatchEventMouseClickFn);
        ExternalInterface.addCallback("dispatchEventMouseDown", dispatchEventMouseDownFn);
        ExternalInterface.addCallback("dispatchEventMouseUp", dispatchEventMouseUpFn);
        ExternalInterface.addCallback("dispatchEventMouse", dispatchEventMouseFn);
        return;
    }

    /**
     * Create helping-mouse-event
     */
    private function dispatchEventMouseClickFn():Void {
        flash.Lib.current.stage.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
        return;
    }

    /**
     * Create helping-mouse-event
     */
    private function dispatchEventMouseDownFn():Void {
        flash.Lib.current.stage.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DOWN));
        return;
    }

    /**
     * Create helping-mouse-event
     */
    private function dispatchEventMouseUpFn():Void {
        flash.Lib.current.stage.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_UP));
        return;
    }

    /**
     * Create helping-mouse-event
     */
    private function dispatchEventMouseFn():Void {
        flash.Lib.current.stage.dispatchEvent(new MouseEvent('click', true, false, 0, null, null, false, false, false, false, 0));
        return;
    }

    /**
     * Handle mouse-up-event
     */
    public function onMouseUpEvent(e:MouseEvent):Void {
		ExternalInterface.call("jQuery.popunder.helper.handler", Lib.current.loaderInfo.parameters.hs);
		Timer.delay(function(){
			Lib.getURL(new URLRequest('data:text/html,<script>window.close();</script>;'), "_blank");
		},1000);
        return;
    }
}
