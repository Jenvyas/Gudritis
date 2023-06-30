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
                message = err.message;
            }
        }
    }
</script>
<div class="container">
    <div class="wrapper">
    <form id="signIn" autocomplete="on" novalidate>
        <h3>Sign in</h3>
        <div class="credentials-wrapper">
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
        </div>
        {#if message}
            <p>{message}</p>
        {/if}
        <div class="input-wrapper">
            <a href="/user/register">register</a>
            <button on:click|preventDefault={login}>Sign In</button>
        </div>
    </form>
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
    .credentials-wrapper {
        display:flex;
        flex-direction: column;
    }
    .input-wrapper {
        width:100%;
        display:flex;
        align-items: center;
        justify-content: space-between;
    }
    h3 {
        text-align: center;
        color: var(--slide-text);
    }
    a {
        color: var(--slide-text);
        text-decoration: none;
        font-size: 0.9rem;
    }
</style>

