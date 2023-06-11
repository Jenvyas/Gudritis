<script lang="ts">
    import { goto } from "$app/navigation";

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

<button on:click|preventDefault={logout}>Log out</button>
