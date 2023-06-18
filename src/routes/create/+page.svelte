<script lang="ts">
    import type { Slide, GameTemplate } from "$lib/models/gameTemplate";
    import EditingSlide from "$lib/components/Game/Editing/EditingSlide.svelte";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import { error } from "@sveltejs/kit";
    import ChoosingEditingSlide from "$lib/components/Game/Editing/ChoosingEditingSlide.svelte";

    const user: LoginSession = get(loginSession);

    if (!user) {
        throw error(404, { message: "User not found" });
    }

    let template: GameTemplate = {
        name: "Template name",
        tags: "",
        slides: [
            {
                duration: 10,
                text: "",
                isMultipleAnswer: false,
                answers: [
                    {
                        index: 0,
                        text: "",
                    },
                    {
                        index: 1,
                        text: "",
                    },
                ],
                correctAnswer: [0],
            },
        ],
        author: user.nickname,
        author_id: user._id,
    };

    console.log(template.slides.length);
    

    let activeSlideIndex: number = 0;

    let oldDuration = template.slides[activeSlideIndex].duration;
</script>

<style>
    .editing-panel {
        display: flex;
        width: 100%;
        height: 100%;
    }
    menu {
        height:max-content;
        margin:0;
        width: 20rem;
        padding-top: 3rem;
        padding-bottom: 3rem;
        padding-left: 0;
        display:flex;
        flex-direction: column;
        color: white;
        overflow: scroll;
        list-style: none;
    }
    menu li{
        display:flex;
        justify-content: space-between;
        background-color: var(--background-nav);
        border-radius: 5px;
        border: 1px solid;
        border-color: var(--slide-answer-panel);
        padding:5px;
        margin: 0.5rem;
    }
    .menu-option {
        font-size: 1rem;
    }
    menu li input[type="checkbox"] {
        height:1.25rem;
        width:1.25rem;
        accent-color: var(--slide-answer-panel);
    }
    .duration {
        color:var(--slide-text);
        background-color: var(--slide-answer-panel);
        border: 1px solid;
        border-color: var(--background-nav);
        font-size: 1rem;
        width:3rem;
        text-align: center;
    }
    .duration:focus {
        outline-color: whitesmoke;
        outline-style: solid;
        outline-width: 1px;
    }
    article {
        padding-top: 3rem;
        padding-bottom: 3rem;
        width:100%;
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
    .slide-change-button:hover  {
        color:whitesmoke;
        cursor: pointer;
    }
    .slide-change-button .mi {
        font-size: 3rem;
    }

</style>

<div class="editing-panel">
    <button class="slide-change-button" disabled={activeSlideIndex < 0} on:click={e=>{
        activeSlideIndex--;
    }}>
        <i class="mi mi-chevron-left"><span class="u-sr-only">Go left slide</span></i>
    </button>

    
    <article>
        {#if activeSlideIndex < template.slides.length && activeSlideIndex >= 0}
        <EditingSlide bind:slide={template.slides[activeSlideIndex]} />
        {:else} 
        <ChoosingEditingSlide bind:slides={template.slides} bind:index={activeSlideIndex}/>
        {/if}
    </article>
    

    <button class="slide-change-button" disabled={activeSlideIndex >= template.slides.length} on:click={e=>{
            activeSlideIndex++;
        }}>
        <i class="mi mi-chevron-right"><span class="u-sr-only">Go right slide</span></i>
    </button>


    <menu>
        {#if activeSlideIndex < template.slides.length && activeSlideIndex >= 0}
        <li>
            <span class="menu-option">Multiple answers:</span><input
                type="checkbox"
                on:input={(e)=>{
                    if(!e.currentTarget.checked) {
                        if(template.slides[activeSlideIndex].correctAnswer.length > 0) {
                            let lastIndex = template.slides[activeSlideIndex].correctAnswer.length-1;
                            template.slides[activeSlideIndex].correctAnswer = [template.slides[activeSlideIndex].correctAnswer[lastIndex]];
                        }
                    }
                    template.slides[activeSlideIndex].isMultipleAnswer=e.currentTarget.checked;
                }}
                bind:checked={template.slides[activeSlideIndex].isMultipleAnswer}
            />
        </li>
        <li>
            <span class="menu-option">Duration:</span> <input
                type="text"
                class="duration"
                on:input={(e) => {
                    let num = Number(e.currentTarget.value);
                    if (
                        isNaN(num) ||
                        !Number.isInteger(num) ||
                        num < 0 ||
                        num > 120
                    ) {
                        e.currentTarget.value = oldDuration.toString();
                        return;
                    } else {
                        oldDuration = Number(e.currentTarget.value);
                    }
                }}
                bind:value={template.slides[activeSlideIndex].duration}
                required
            />
        </li>
        {/if}
    </menu>
</div>


