<script lang="ts">
    import type { PageData } from "./$types";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import type { Player } from "$lib/models/gameSession";
    import { error } from "@sveltejs/kit";
    import HostDisplay from "$lib/components/GameSession/HostDisplay.svelte";
    import PlayerDisplay from "$lib/components/GameSession/PlayerDisplay.svelte";

    let establishedConnection: boolean = false;

    let socket: WebSocket;

    export let data: PageData;

    const user: LoginSession = get(loginSession);

    let nickname = user?.nickname || "";

    const isHost = data.isHost;

    const player: Player = {
        user_id: user?._id || "",
        nickname: nickname,
        registered_player: !!user,
    };

    let lastMessage: any;

    if (isHost) {
        socket = new WebSocket(
            `ws://localhost/game?code=${data.gameId}&nickname=Host&registered_player=${player.registered_player}`
        );
        socket.addEventListener("open", (event) => {
            establishedConnection = true;
            console.log("Established");
        });
        socket.addEventListener("message", (event) => {
            console.log(event);
            
            lastMessage = event.data;
            console.log(lastMessage);
        });
        socket.addEventListener("error",(event)=>{
            console.log(event);
        })
    }

    let lobbyPlayers: Array<Player> = [];

    let inLobby = false;

    const joinLobby = () => {
        socket = new WebSocket(
            `ws://localhost/game?code=${data.gameId}&nickname=${player.nickname}&registered_player=${player.registered_player}`
        );
        socket.addEventListener("open", (event) => {
            establishedConnection = true;
            console.log("Established");
        });
        socket.addEventListener("message", (event) => {
            lastMessage = event.data;
            console.log(JSON.parse(lastMessage));
        });
    };
</script>

<div class="game-wrapper">
    <div class="game-container">
        {#if isHost}
            <HostDisplay bind:lastMessage bind:socket/>
        {:else if establishedConnection}
            <PlayerDisplay bind:lastMessage bind:socket/>
        {:else}
            <div>
                <input type="text" bind:value={nickname} />
                <button on:click={joinLobby}>Join</button>
            </div>
        {/if}
    </div>
</div>

<style>
    .game-wrapper {
        display: flex;
        width: 100%;
        padding: 2%;
    }
    .game-container {
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: var(--background-nav);
        border-radius: 5px;
        border: 1px solid;
        border-color: var(--slide-answer-panel);
    }
</style>
