import { _decorator, Component, Node } from 'cc';
import { loadMidi } from '../../Common/MidiReader';
const { ccclass, property } = _decorator;

@ccclass('HomeController')
export class HomeController extends Component {


    start() {
        console.log(window);
    }

    update(deltaTime: number) {

    }

    //#region callbacks

    public onTouch_Test() {
    }

    //#endregion
}