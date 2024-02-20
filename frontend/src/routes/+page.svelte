<script lang="ts">
    import { goto } from "$app/navigation";
    import type { ActionData } from "./$types";

    let code: number = 0;

    export let form: ActionData;
</script>
<style>
    h1 {
        text-align: center;
    }
    .game-join {
        display:flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        margin-bottom: 4rem;
        width:100%;
    }
    .incorrect-input {
        text-align: center;
        color: var(--error);
    }
</style>

<div class="game-join">
    <h1>Gudritis</h1>
    <form method="POST" action="?/joinGame">
            {#if form?.noGame}
            <div class="incorrect-input">No game found</div>
            {/if}
            <input type="number" name="code" bind:value={code}>
            <button type="submit">Join</button>
            <button disabled={true}>Spectate</button>
    </form>
    
</div>
