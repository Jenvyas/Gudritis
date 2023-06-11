<script lang="ts">
    import { goto } from "$app/navigation";
    import { loginSession } from "$lib/stores";
    let message: string;

    interface User {
        username: string;
        email: string;
        nickname: string;
        password: string;
    }

    let user: User = {
        username: "",
        email: "",
        nickname: "",
        password: "",
    };

    let confirmPassword: HTMLInputElement;

    async function register() {
        message = "";
        const form = <HTMLFormElement>document.getElementById("register");

        if(!passwordMatch()) {
            confirmPassword.classList.add('is-invalid');
            return;
        }

        if (form.checkValidity()) {
            try {
                registerLocal(user);
            } catch (err) {
                if (err instanceof Error) {
                    console.error("Registration error", err.message);
                    message = err.message;
                }
            }
        } else {
            form.classList.add("was-validated");
        }
    }

    async function registerLocal(user: User) {
        try {
            const res = await fetch("/auth/register", {
                method: "POST",
                body: JSON.stringify(user),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const fromEndpoint = await res.json();
            if (res.ok) {
                loginSession.set(fromEndpoint.user);
                goto("/");
            } else {
                throw new Error(fromEndpoint.message);
            }
        } catch (err) {
            if (err instanceof Error) {
                console.error("Registration error", err);
            }
        }
    }

    function passwordMatch(): boolean {
        if (!user) {
            return false;
        }
        if (!user.password) {
            user.password = '';
        }
        return user.password === confirmPassword.value;
    }
</script>

<form id="register" autocomplete="on" novalidate>
    <h4>Sign in</h4>
    <input
        type="text"
        bind:value={user.username}
        autocomplete="username"
        placeholder="username"
        required
    />
    <input
        type="text"
        bind:value={user.email}
        autocomplete="email"
        placeholder="email"
        required
    />
    <input
    type="text"
    bind:value={user.nickname}
    placeholder="nickname"
    required
    />
    <input
        type="password"
        bind:value={user.password}
        minlength="8"
        maxlength="32"
        autocomplete="new-password"
        placeholder="password"
        required
    />
    <input
        type="password"
        bind:this={confirmPassword}
        minlength="8"
        maxlength="32"
        autocomplete="new-password"
        placeholder="confirm password"
        required
    />
    {#if message}
        <p>{message}</p>
    {/if}
    <button on:click|preventDefault={register}>Register</button>
</form>
