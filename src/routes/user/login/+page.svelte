<script lang="ts">
    import { goto } from "$app/navigation";
    import { loginSession } from "$lib/stores";
    
    interface Credentials {
        name: string;
        password: string;
    }

    const credentials: Credentials = {
        name: "",
        password: "",
    };

    let message: string;

    async function login() {
        message = "";
        const form = <HTMLFormElement>document.getElementById("signIn");

        if (form.checkValidity()) {
            try {
                await loginLocal(credentials);
            } catch (err) {
                if (err instanceof Error) {
                    console.error("Login error", err.message);
                    message = err.message;
                }
            }
        } else {
            form.classList.add("was-validated");
        }
    }

    async function loginLocal(credentials: Credentials) {
        try {
            const res = await fetch("/auth/login", {
                method: "POST",
                body: JSON.stringify(credentials),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const fromEndpoint = await res.json();
            if (res.ok) {
                loginSession.set(fromEndpoint.user);
                const { role } = fromEndpoint.user;
                if (role === "user") return goto("/user");
                if (role === "admin") return goto("/admin");
                return goto("/");
            } else {
                throw new Error(fromEndpoint.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error("Login error", err);
            }
        }
    }
</script>

<form id="signIn" autocomplete="on" novalidate>
    <h4>Sign in</h4>
    <input
        type="text"
        bind:value={credentials.name}
        autocomplete="username"
        placeholder="Email/username"
        required
    />
    <input
        type="password"
        bind:value={credentials.password}
        minlength="8"
        maxlength="32"
        placeholder="password"
        required
    />
    {#if message}
        <p>{message}</p>
    {/if}
    <button on:click|preventDefault={login}>Sign In</button>
</form>
