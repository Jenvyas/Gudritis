<script lang="ts">
    import { goto } from "$app/navigation";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";

    const user = get(loginSession);

    async function logout() {
        const res = await fetch("/auth/logout", {
                method: "POST",
                body: JSON.stringify({}),
                headers: {
                    "Content-Type": "application/json",
                },
            });
        const fromEndpoint = await res.json();
        if (res.ok) {
            console.log(fromEndpoint.message);
            goto('/');
        }
    };
</script>

<div class="container">
    <div class="wrapper">
        <div class="info-wrapper">
            <h4>username: {user?.username}</h4>
            <h4>nickname: {user?.nickname}</h4>
            <h4>email: {user?.email}</h4>
        </div>
        <button on:click|preventDefault={logout}>Log out</button>
    </div>
</div>

<style>
    .container {
        width:100%;
        display:flex;
        align-items: center;
        justify-content: center;
    }
    .wrapper {
        padding:1%;
        background-color: var(--slide-panel);
        border-radius: 3px;
        border: solid 1px;
        border-color: var(--slide-text);
    }
    .info-wrapper {
        color: var(--slide-text);
        text-decoration: none;
        font-size: 0.9rem;
    }
    h4 {
        margin:3px;
    }
</style>