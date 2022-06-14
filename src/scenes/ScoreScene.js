import BaseScene from "./BaseScene";

class ScoreScene extends BaseScene {
    constructor (config) {
        super('ScoreScene', {...config, canGoBack: true});

    }

    create () {
        super.create();
        const bestScore = localStorage.getItem('bestScore');
        this.add.text(...this.screenCenter, `Best Score: ${bestScore || 0}`, this.fontOptions).setOrigin(.5, 1);
    }

    update () {

    }
}

export default ScoreScene;