<script lang="ts">
    import { loginSession } from "$lib/stores";
    import { error } from "@sveltejs/kit";
    import { io } from "socket.io-client";
    import { get } from "svelte/store";
    import type { PageData } from "./$types";
    import { goto } from "$app/navigation";

    export let data: PageData;

    let {gameId, gameTemplate, code} = data;

    let user = get(loginSession);

    if (!user) {
        throw error(404, "User not found");
    }

    let socket = io();
    socket.connect();
    socket.emit("new-game", {hostId:user._id, gameId, gameTemplate, code});
    socket.on("new-game-ready",()=>{
        goto(`/${code}`);
    });

</script>