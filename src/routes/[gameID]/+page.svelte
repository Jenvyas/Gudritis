<script lang="ts">
    import { Socket, io } from "socket.io-client";
    import type { PageData } from "./$types";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import type { Player } from "$lib/models/gameSession";
    import { error } from "@sveltejs/kit";

    let socket = io();

    export let data: PageData;

    const user: LoginSession = get(loginSession);

    let nickname = user?.nickname || "";

    const gameSessionId = data.gameSessionId;

    const SessionId = data.SessionId;

    if (!SessionId) {
        throw error(404);
    }

    const isHost = data.isHost;

    let lobbyPlayers: Array<Player> = [];

    let inLobby = false;

    socket.on("accepted-player",()=>{
        console.log("a");
        
        inLobby=true;
    });

    socket.on("player-joined",({players}: {players:Array<Player>})=>{
        lobbyPlayers = players;
    })

    const joinLobby = () => {
        const player:Player = {
            registered_player: !!(user),
            player_id: SessionId,
            nickname: nickname
        }
        const gameId = gameSessionId;
        console.log({player,gameId});
        
        socket.emit("join-game",{player,gameId});
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
            <button on:click={joinLobby}>Join</button>
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