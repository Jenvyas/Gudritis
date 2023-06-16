<script lang="ts">
    import type { Slide, GameTemplate } from "$lib/models/gameTemplate";
    import EditingSlide from "$lib/components/Game/Editing/EditingSlide.svelte";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import { error } from "@sveltejs/kit";

    const user: LoginSession = get(loginSession);

    if (!user) {
        throw error(404, { message: "User not found" });
    }

    let template: GameTemplate = {
        name: "Template name",
        tags: "",
        slides: [
            {
                index: 0,
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
        background-color: var(--background-nav);
        border-radius: 5px;
        border: 1px solid;
        border-color: var(--slide-answer-panel);
        padding:5px;
        margin: 0.5rem;
    }
    .menu-option {
        font-size: 1.25rem;
    }
    menu li input[type="checkbox"] {
        height:1.25rem;
        width:1.25rem;
    }
    .duration {
        color:var(--slide-text);
        background-color: transparent;
        border: 1px solid;
        border-color: var(--slide-answer-panel);
        font-size: 1.25rem;
        width:3rem;
        text-align: center;
    }
    article {
        padding: 3rem;
        padding-right: 5rem;
        padding-left: 5rem;
        width:100%;
    }
</style>

<div class="editing-panel">
    <article>
        <EditingSlide bind:slide={template.slides[activeSlideIndex]} />
    </article>
    <menu>
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
    </menu>
</div>


