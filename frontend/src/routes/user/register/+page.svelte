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

<div class="container">
    <div class="wrapper">
        <form id="register" autocomplete="on" novalidate>
            <h3>Sign in</h3>
                <div class="credentials-wrapper">
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
            </div>
            {#if message}
                <p>{message}</p>
            {/if}
            <div class="input-wrapper">
                <button on:click|preventDefault={register}>Register</button>
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
    .credentials-wrapper input {
        margin-bottom: 5px;
    }
    .input-wrapper {
        width:100%;
        display:flex;
        align-items: center;
        justify-content: center;
    }
    h3 {
        text-align: center;
        color: var(--slide-text);
    }
</style>
