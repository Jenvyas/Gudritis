<script lang="ts">
    export let lastMessage: any;
    export let socket: WebSocket;
    let startMessage = {method: "Start"}
    const startGame = () => {
        socket.send(JSON.stringify(startMessage));
    }
</script>

<p>{lastMessage}</p>
<button on:click={startGame}>bbjodsabjosd</button>