// ENUMS
var GameState = {
    LOBBY: 0,
    TASKS: 1,
    DISCUSSION: 2,
    MENU: 3,
    ENDED: 4,
    UNKNOWN: 5
}

var PlayerAction = {
    Joined: 0,
    Left: 1,
    Died: 2,
    ChangedColor: 3,
    ForceUpdated: 4,
    Disconnected: 5,
    Exited: 6,
}

var PlayMap = {
    skeld: 0,
    mira: 1,
    polus: 2,
    airship: 4
}

var MapImages = {
    skeld: "image/map-skeld.png",
    mira: "image/map-mira.png",
    polus: "image/map-polus.png",
    airship: "image/map-airship.png"
}

// create Vue
new Vue({
    el: '#app',
    vue: new Vue(),
    data: {
        stateFlag: 4,
        socket: null,
        eventPool: [],
        players: {},
        poolFlag: false,
        helpFlag: false,
        mapId: 0,
    },

    methods: {
        addPlayer: function (e, t, r) {
            if (e in this.players) {
                this.players[e].IsDead = t;
                this.players[e].Color = r;
            } else {
                this.players[e] = {
                    IsDead: t,
                    Color: r,
                    show: true
                }
            }
        },

        removePlayer: function (e) {
            delete this.players[e];
        },

        allAlive: function () {
            for (var e = 0, t = Object.keys(this.players); e < t.length; e++) {
                var r = t[e];
                this.players[r].IsDead = false;
            }
        },

        trigger: function () {
            var e = this;

            if (false === this.poolFlag) {
                this.eventPool.forEach(
                    function (t) {
                        PlayerAction.Left !== t.Action
                            && PlayerAction.Disconnected !== t.Action
                            || e.removePlayer(t.Name);

                        PlayerAction.Joined !== t.Action
                            && PlayerAction.ChangedColor !== t.Action
                            || e.addPlayer(t.Name, t.IsDead, t.Color);

                        PlayerAction.Died !== t.Action
                            && PlayerAction.Exited !== t.Action
                            || e.addPlayer(t.Name, true, t.Color);

                    });

                this.eventPool = [];

            } else {
                console.log("trigger false");
            }
        },
        toggleState(state) {
            document.getElementById("map-image").src = "";
            document.getElementById("entercode-curtain").src = "";
            document.getElementById("roomcode-curtain").src = "";

            switch (state) {
                case GameState.MENU:
                    document.getElementById("entercode-curtain").src = "image/entercode-curtain.png";
                    break;

                case GameState.LOBBY:
                    document.getElementById("roomcode-curtain").src = "image/roomcode-curtain.png";
                    break;

                case GameState.TASKS:
                case GameState.DISCUSSION:
                    this.toggleMap(this.mapId);
                    break;

            }
        },
        toggleMap(map) {
            document.getElementById("map-image").src = "";

            switch (map) {
                case PlayMap.skeld:
                    document.getElementById("map-image").src = MapImages.skeld;
                    break;

                case PlayMap.mira:
                    document.getElementById("map-image").src = MapImages.mira;
                    break;

                case PlayMap.polus:
                    document.getElementById("map-image").src = MapImages.polus;
                    break;

                case PlayMap.airship:
                    document.getElementById("map-image").src = MapImages.airship;
                    break;
            }
        }
    },

    mounted: function () {
        var e = this;
        this.socket = new WebSocket("ws://localhost:42069/api");

        this.socket.addEventListener("open", (function (e) {
            console.log(e);
        }));

        this.socket.addEventListener("message", (function (t) {
            var r = JSON.parse(t.data);

            console.log("JSON.parse(t.data);");
            console.log(r);

            if (0 === r.EventID) {
                var o = JSON.parse(r.EventData);

                // console.log("JSON.parse(r.EventData);");
                // console.log(o);

                e.toggleState(o.NewState);

                switch (e.stateFlag = o.NewState, o.NewState) {
                    case GameState.LOBBY:
                        console.log("GameState.LOBBY");
                        e.poolFlag = false;
                        break;

                    case GameState.TASKS:
                        console.log("GameState.TASKS");
                        e.trigger();
                        setTimeout((function () {
                            e.poolFlag = true;
                        }), 5000);
                        break;

                    case GameState.DISCUSSION:
                        console.log("GameState.DISCUSSION");
                        e.poolFlag = false;
                        e.trigger();
                        break;

                    case GameState.MENU:
                        console.log("GameState.MENU");
                        e.poolFlag = false;
                        break;

                    case GameState.ENDED:
                        console.log("GameState.ENDED");
                        e.poolFlag = false;
                        break;
                }
            }

            if (1 === r.EventID) {
                var n = JSON.parse(r.EventData);
                e.eventPool.push(n);
                e.trigger();
            }

            if (2 === r.EventID) {
                var n = JSON.parse(r.EventData);
                e.mapId = n.Map;
            }

            if (3 === r.EventID) {
                setTimeout((function () {
                    e.allAlive();
                }), 5000);
                e.poolFlag = false;
            }

        }));

        this.socket.addEventListener("close", (function (e) {
            console.log("接続が閉じられたときに呼び出されるイベント");
            console.log(e)
        }));

        this.socket.addEventListener("error", (function (e) {
            console.log("エラーが発生したときに呼び出されるイベント");
            console.log(e)
        }));

    },
})