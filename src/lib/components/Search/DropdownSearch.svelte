<script lang="ts">
    import type { GameTemplate, StoredGameTemplate } from "$lib/models/gameTemplate";
    import type { LoginSession } from "$lib/models/session";
    import { loginSession } from "$lib/stores";
    import { deleteTemplate, hostTemplate } from "$lib/utils/templateUtils";
    import { error } from "@sveltejs/kit";
    import { get } from "svelte/store";

    const user: LoginSession = get(loginSession);

    if (!user) {
        throw error(404,"No user found");
    }

    export let template: StoredGameTemplate;

    let show: boolean = false;

    let dropdownDisabled = false;

    let dropdownToggle: HTMLElement;

    const handleDropdownFocusLoss = ({ relatedTarget, currentTarget }: { relatedTarget: any, currentTarget: any }) => {
    if (relatedTarget instanceof HTMLElement && currentTarget.contains(relatedTarget)) return
        show = false;
    }

    const flagTemplate = async () => {
        const newTemplate: StoredGameTemplate = {...template, flagged: !template.flagged };
        try {
            const res = await fetch(`/game-template/${template._id}`, {
                method: "PUT",
                body: JSON.stringify(newTemplate),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const fromEndpoint = await res.json();
            if (res.status === 200) {
                template = newTemplate;
            } else {
                throw new Error(fromEndpoint.message);
            }
        } catch (error) {
            console.error(error);
        }
    }

    const saveToCollection = async () => {
        try {
            const newTemplate: GameTemplate = {
                ...template,
                author_id: user?._id,
                author: user?.nickname
            }

            const postRes = await fetch("/game-template", {
                method: "POST",
                body: JSON.stringify(newTemplate),
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const postBody = await postRes.json();
        } catch (error) {
            console.error(error);
        }
    }
</script>

<div on:focusout={handleDropdownFocusLoss}>
    <button type="button" class="dropdown-button" bind:this={dropdownToggle} on:click={()=>{
        show = !show;
        }} disabled={dropdownDisabled}>
        <i class="mi mi-options-horizontal"><span class="u-sr-only">Go left slide</span></i>
    </button>
<!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="dropdown-menu" style:visibility={show ? 'visible' : 'hidden'}>
        <button class="dropdown-item" on:click={()=>{hostTemplate(template._id)}}>Host</button>
        <button class="dropdown-item" on:click={saveToCollection} disabled={template.author_id===user?._id}>Save to collection</button>
        {#if user.role==="admin"}
        <button class="dropdown-item" on:click={flagTemplate}>{template.flagged ? "Flag" : "Unflag"}</button>
        <button class="dropdown-item" on:click={()=>{deleteTemplate(template._id)}}>Delete</button>
        {/if}
    </div>
</div>

<style>
    .dropdown-button {
        color: var(--slide-darker-text);
        background-color: transparent;
        border: none;
    }
    .dropdown-button:hover {
        cursor: pointer;
        color: var(--slide-text);
    }
    .dropdown-menu {
        display:block;
        position: absolute;
        z-index: 1;
        background-color: var(--slide-panel);
        border-radius: 3px;
    }
    .dropdown-item {
        display: block;
        text-align: left;
        padding: 5px;
        margin: 4px;
        font-size: 0.9rem;
        font-family: 'Ubuntu';
        font-weight: 200;
        color:white;
        background-color: var(--slide-panel);
        border: none;
        text-decoration: none;
    }
    .dropdown-item:disabled {
        color: var(--slide-darker-text);
    }
    .dropdown-item:disabled:hover {
        background-color: var(--slide-panel);
    }
    .dropdown-item:hover {
        cursor:default;
        background-color: var(--slide-answer-panel);
    }
</style>
