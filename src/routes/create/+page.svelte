<script lang="ts">
    import type { Slide, GameTemplate } from "$lib/models/gameTemplate";
    import EditingSlide from "$lib/components/Game/Editing/EditingSlide.svelte";
    import { loginSession } from "$lib/stores";
    import { get } from "svelte/store";
    import type { LoginSession } from "$lib/models/session";
    import { error } from "@sveltejs/kit";
    import ChoosingEditingSlide from "$lib/components/Game/Editing/ChoosingEditingSlide.svelte";
    import SlideTypeOne from "$lib/components/Game/Editing/EditingTemplateSlideTypes/SlideTypeOne.svelte";
    import SlideTypeTwo from "$lib/components/Game/Editing/EditingTemplateSlideTypes/SlideTypeTwo.svelte";
    import { slideValidate, type SlideError } from "$lib/validation/templateValidation";
    import SubmitPrompt from "$lib/components/Game/Editing/SubmitPrompt.svelte";
    import { goto } from "$app/navigation";

    const user: LoginSession = get(loginSession);

    if (!user) {
        throw error(404, { message: "User not found" });
    }

    let template: GameTemplate = {
        name: "",
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

    let activeSlideIndex: number = 0;

    let oldDuration = template.slides[activeSlideIndex].duration;

    let slideErrors: Array<SlideError> = [];

    $: slidesNotValid = !(slideErrors.length === 0);

    let noName = true;

    
    let showSubmit = false;
    
    let awaitingResponse = false;

    $: disableSubmit = noName || (slideErrors.length!==0) || awaitingResponse;
    
    const localValidateTemplate = (template: GameTemplate): boolean => {
        const invalidSlides: Array<SlideError> = template.slides.reduce(slideValidate, [] as Array<SlideError>);

        if (invalidSlides.length!==0) {
            slideErrors = invalidSlides;
            return false;
        }
        return true;
    }

    const createTemplate = (template: GameTemplate) => {
        if(!localValidateTemplate(template)){
            console.error("Submitted slide info was not valid.");
            return;
        };

        showSubmit = true;
    }

    const submitTemplate = async (template: GameTemplate) => {
        if (template.name === "") {
            noName = true;
            return;
        }
        try {
            awaitingResponse = true;
            const res = await fetch("/game-template", {
                method: "POST",
                body: JSON.stringify(template),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            awaitingResponse = false;
            if (res.status === 200) {
                goto('/collection');
            }
            const body = await res.json();
        } catch (error) {

        }
    }

    const removeErrorIfValid = (errorIndex: number) => {
        const error = slideErrors[errorIndex];
        if (!(error.correctAnswerOutOfBounds 
        || error.durationTooLong 
        || error.durationTooShort 
        || error.invalidQuestion 
        || (error.invalidAnswers.length !== 0) 
        || error.multipleCorrectOnSingleAnswer 
        || error.noCorrectAnswer)) {
            slideErrors.splice(errorIndex, 1);
        }        
    }

    const removeAnswerError = (e: CustomEvent<any>, slideIndex: number) => {
        const answerIndex = e.detail.index;
        let errorIndex = slideErrors.findIndex(i=>i.index===slideIndex);
        if (errorIndex === -1) {
            return;
        }
        slideErrors[errorIndex].invalidAnswers = slideErrors[errorIndex].invalidAnswers.filter((e)=>e.index!==answerIndex);
        removeErrorIfValid(errorIndex);
    }

    const removeCorrectAnswerError = (slideIndex: number) => {
        let errorIndex = slideErrors.findIndex(i=>i.index===slideIndex);
        if (errorIndex === -1) {
            return;
        }
        slideErrors[errorIndex].noCorrectAnswer = false;
        slideErrors[errorIndex].correctAnswerOutOfBounds = false;
        slideErrors[errorIndex].multipleCorrectOnSingleAnswer = false;
        removeErrorIfValid(errorIndex);
    }
</script>

<div class="editing-panel">
    <button class="slide-change-button" disabled={activeSlideIndex < 0 || (template.slides.length === 0)} on:click={e=>{
        activeSlideIndex--;
    }}>
        <i class="mi mi-chevron-left"><span class="u-sr-only">Go left slide</span></i>
    </button>

    
    <article>
        {#if activeSlideIndex < template.slides.length && activeSlideIndex >= 0}
        <EditingSlide bind:slide={template.slides[activeSlideIndex]} 
            on:removeCorrectAnswerError={()=>{removeCorrectAnswerError(activeSlideIndex)}} 
            on:removeAnswerError={(e)=>{removeAnswerError(e, activeSlideIndex)}}
            slideError={slideErrors.find(e=>e.index===activeSlideIndex)}/>
        <div class="page-count">{`(${activeSlideIndex+1}/${template.slides.length})`}</div>
        {:else} 
        <ChoosingEditingSlide bind:slides={template.slides} bind:index={activeSlideIndex}/>
        <div class="page-count hidden">{`(${activeSlideIndex+1}/${template.slides.length})`}</div>
        {/if}
    </article>
    

    <button class="slide-change-button" disabled={activeSlideIndex >= template.slides.length || (template.slides.length === 0)} on:click={e=>{
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
        <li class="change-slide-type">
            Slide type
            <div class="type-wrapper">
                <div class="container">
                    <button class:current-type={template.slides[activeSlideIndex].answers.length === 2} on:click={()=>{
                        if (template.slides[activeSlideIndex].answers.length !== 2) {
                            template.slides[activeSlideIndex].answers = template.slides[activeSlideIndex].answers.splice(0, 2);
                            template.slides[activeSlideIndex].correctAnswer = template.slides[activeSlideIndex].correctAnswer.filter(i=>{
                                return i<3;
                            })
                            slideErrors = slideErrors.filter(e=>e.index!==activeSlideIndex);
                        }
                    }}>
                        <SlideTypeOne/>
                    </button>
                </div>
                <div class="container">
                    <button class:current-type={template.slides[activeSlideIndex].answers.length === 4} on:click={()=>{
                        if (template.slides[activeSlideIndex].answers.length !== 4) {
                            template.slides[activeSlideIndex].answers = [...template.slides[activeSlideIndex].answers, {index:2, text:""}, {index:3, text:""}];
                            slideErrors = slideErrors.filter(e=>e.index!==activeSlideIndex);
                        }
                    }}>
                        <SlideTypeTwo/>
                    </button>
                </div>
            </div>
        </li>
        <button on:click={()=>{
            slideErrors = slideErrors.filter((e)=>e.index!==activeSlideIndex);
            slideErrors = slideErrors.map(e=>{
                if (e.index > activeSlideIndex) {
                    e.index--;
                }
                return e;
            });
            template.slides = template.slides.filter((_slide,index)=>index!==activeSlideIndex);
        }}>Delete slide</button>
        <button disabled={slidesNotValid} on:click={()=>{createTemplate(template)}}>Done</button>
        {/if}
    </menu>
</div>
<SubmitPrompt bind:showModal = {showSubmit} on:submit={()=>submitTemplate(template)} bind:disableSubmit>
    <input type="text" maxlength="32" bind:value={template.name} class:name-error={noName} on:input={()=>{noName=false}}>
</SubmitPrompt>

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
    .change-slide-type {
        display:flex;
        flex-direction: column;
        align-items: center;
    }
    .change-slide-type .container {
        height:100%;
    }
    .change-slide-type button {
        padding:0;
        background-color: transparent;
        border:none;
        width:100%;
        height:100%;
    }
    .type-wrapper {
        display:flex;
        height:100%;
        width:100%;
        margin-top: 5%;
    }
    .current-type {
        outline:solid red 2px;
    }
    .container {
        flex: 1 0 40%;
        height:100%;
        padding:2%;
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
        display:flex;
        flex-direction: column;
        width:100%;
        padding-top: 2rem;
        padding-bottom:1rem;
        align-items: center;
        justify-content: center;
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
        border-radius: 5px;
    }
    .hidden {
        visibility: hidden;
    }
</style>