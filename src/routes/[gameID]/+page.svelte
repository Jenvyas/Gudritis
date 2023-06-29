<script lang="ts">
    import { io } from "socket.io-client";
    import type { PageData } from "./$types";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";

    export let data: PageData;

    const user: LoginSession = get(loginSession);

    const gameSessionId = data.gameSessionId;

    const SessionId = data.SessionId;

    const isHost = data.isHost;

    let inLobby = false;

    let lobby = true;
    
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
        <div></div>
        {:else}
        <form action="POST">
            <input type="text" placeholder="nickname" value={user?.nickname || ""}>
            <button type="submit">Join</button>
        </form>
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
    form input {
        text-align: center;
    }
</style>