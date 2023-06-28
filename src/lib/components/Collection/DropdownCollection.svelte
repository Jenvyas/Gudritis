<script lang="ts">
    import type { StoredGameTemplate } from "$lib/models/gameTemplate";
    import { deleteTemplate, hostTemplate } from "$lib/utils/templateUtils";
    import { createEventDispatcher } from "svelte";

    let dispatch = createEventDispatcher();

    export let template: StoredGameTemplate;

    let show: boolean = false;

    let dropdownDisabled = false;

    const handleDropdownFocusLoss = ({ relatedTarget, currentTarget }: { relatedTarget: any, currentTarget: any }) => {
    if (relatedTarget instanceof HTMLElement && currentTarget.contains(relatedTarget)) return
        show = false;
    }

    const changeTemplatePublic = async () => {
        const newTemplate: StoredGameTemplate = {...template, public: !template.public };
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
</script>

<div on:focusout={handleDropdownFocusLoss}>
    <button type="button" class="dropdown-button" on:click={()=>{
        show = !show;
        }} disabled={dropdownDisabled}>
        <i class="mi mi-options-horizontal"><span class="u-sr-only">Go left slide</span></i>
    </button>
<!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="dropdown-menu" style:visibility={show ? 'visible' : 'hidden'}>
        <a class="dropdown-item" href="/edit/{template._id}">Edit</a>
        <button class="dropdown-item" on:click={()=>{hostTemplate(template._id)}}></button>
        <button class="dropdown-item" on:click={changeTemplatePublic}>{template.public ? "Make private" : "Make public"}</button>
        <button class="dropdown-item" on:click={async ()=>{
            try {
                await deleteTemplate(template._id);
                dispatch("templateDeleted");
            } catch (error) {
                console.error(error);
            }
        }}>Delete</button>
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
    .dropdown-item:hover {
        cursor:default;
        background-color: var(--slide-answer-panel);
    }
</style>
