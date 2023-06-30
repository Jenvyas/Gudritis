<script lang="ts">
    import type { GameTemplate } from "$lib/models/gameTemplate";
    import ViewingSlide from "./ViewingSlide.svelte";

	export let showModal: boolean; // boolean

    export let template: GameTemplate;

	let dialog: HTMLDialogElement; // HTMLDialogElement

    export let activeSlideIndex = 0;

	$: if (dialog && showModal) dialog.showModal();

</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
	bind:this={dialog}
	on:close={() => (showModal = false)}
	on:click|self={() => dialog.close()}
>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
    
	<div class="wrapper" on:click|stopPropagation >
        <button class="slide-change-button" disabled={activeSlideIndex <= 0 || (template.slides.length === 0)} on:click={e=>{
            activeSlideIndex--;
        }}>
            <i class="mi mi-chevron-left"><span class="u-sr-only">Go left slide</span></i>
        </button>
            <article>
                <ViewingSlide bind:slide={template.slides[activeSlideIndex]}/>
                <div class="page-count">{`(${activeSlideIndex+1}/${template.slides.length})`}</div>
            </article>
            <button class="slide-change-button" disabled={activeSlideIndex + 1 >= template.slides.length || (template.slides.length === 0)} on:click={e=>{
                activeSlideIndex++;
            }}>
            <i class="mi mi-chevron-right"><span class="u-sr-only">Go right slide</span></i>
        </button>
		<!-- svelte-ignore a11y-autofocus -->
	</div>
</dialog>

<style>
    
	dialog {
		max-width: 70em;
        width:80%;
        height:90%;
		border-radius: 0.2em;
		border: none;
		padding: 0;
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
    article {
        display:flex;
        flex-direction: column;
        width:100%;

        padding-top: 2rem;
        padding-bottom:1rem;
        align-items: center;
        justify-content: center;
    }
    .wrapper {
        display:flex;
        height:100%;
    }
    .slide-change-button  {
        width:5rem;
        padding:0;
        background-color: transparent;
        border:none;
        color:gray;
    }
    .slide-change-button[disabled] {
        color:black;
    }
    .slide-change-button[disabled]:hover {
        color: black;
        cursor: auto;
    }
    .slide-change-button:hover {
        color:whitesmoke;
        cursor: pointer;
    }
    .slide-change-button .mi {
        font-size: 3rem;
    }
    .page-count {
        color: var(--slide-darker-text);
        font-size: 1.5rem;
        margin-top: 0.5rem;
        padding:3px;
        background-color: var(--background-nav);
        border-radius: 3px;
    }
</style>