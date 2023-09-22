<script lang="ts">
    import type { PageData } from "./$types";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import type { Player } from "$lib/models/gameSession";
    import { error } from "@sveltejs/kit";

    const socket = new WebSocket("ws://localhost/socket");

    let establishedConnection: boolean = false;

    socket.addEventListener("open", (event) => {
        establishedConnection = true;
        joinLobby();
    });

    socket.addEventListener("message", (event) => {
        console.log(event.data);
    })

    export let data: PageData;

    const user: LoginSession = get(loginSession);

    let nickname = user?.nickname || "";

    const gameSessionId = data.gameId;

    const SessionId = data.SessionId;

    if (!SessionId) {
        throw error(404);
    }

    const isHost = data.isHost;

    let lobbyPlayers: Array<Player> = [];

    let inLobby = false;

    const joinLobby = () => {
        const code = gameSessionId;
        const player: Player = {
            user_id: user?._id || "",
            nickname: nickname,
            registered_player: !!(user),
        }

        let joinMessage = {
            "method": "Join",
            ...player,
            "game_code": code,
        }
        
        socket.send(JSON.stringify(joinMessage));
    }
    
    if (isHost) {

    }

    if (user) {
        
    } else {

    }
</script>

<div class="game-wrapper">
    <div class="game-container">
        {#if isHost}
        <div>
            
        </div>
        {:else}
        {#if inLobby}
        <div>
            <ul>
                {#each lobbyPlayers as player}
                <li>{player.nickname}</li>
                {/each}
            </ul>
        </div>
        {:else}
        <div>
            <input type="text" bind:value={nickname}>
            <button on:click={joinLobby} disabled={!establishedConnection}>Join</button>
        </div>
        {/if}
        {/if}
    </div>
</div>

<style>
    .game-wrapper {
        display:flex;
        width:100%;
        padding:2%;
    }
    .game-container {
        width:100%;
        display:flex;
        justify-content: center;
        align-items: center;
        background-color: var(--background-nav);
        border-radius: 5px;
        border: 1px solid;
        border-color: var(--slide-answer-panel);
    }
</style>