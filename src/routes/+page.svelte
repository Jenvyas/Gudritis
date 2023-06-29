<script lang="ts">
    import { goto } from "$app/navigation";

    let code: number = 0;

    $: console.log(code);

    const goToGame = async () =>{
        await goto(`/bob`);
    }
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
</style>

<div class="game-join">
    <h1>Gudritis</h1>
    <form>
            <input type="number" bind:value={code}>
            <button on:click={goToGame}>Join</button>
            <button>Spectate</button>
    </form>
</div>
