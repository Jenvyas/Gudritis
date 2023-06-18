<script lang="ts">
    import type { Slide } from "$lib/models/gameTemplate";
    import EditingAnswer from "./EditingAnswer.svelte";
    import SlideTypeOne from "./EditingTemplateSlideTypes/SlideTypeOne.svelte";
    import SlideTypeTwo from "./EditingTemplateSlideTypes/SlideTypeTwo.svelte";

    export let slides: Array<Slide>;
    export let index: number;
</script>

<style>
    section {
        width: 100%;
        height: 100%;
        display:flex;
        background-color: var(--background-nav);
        border-radius: 10px;
        overflow: hidden;
    } 
    .container {
        flex:1;
    }
    .padding {
        padding: 4em;
    }
    .slide-type-button {
        width:100%;
        padding:0;
        border-radius: 5px;
        background-color: transparent;
        border: none;
    }
    .slide-type-button:hover {
        cursor: pointer;
        box-shadow: 0 0 40px 20px rgba(186, 172, 222, 0.2);
    }
    .flex-center {
        display:flex;
        align-items: center;
        justify-content: center;
    }
</style>

<section>
    <div class="container padding flex-center">
        <button class="slide-type-button" on:click={()=>{
            const slideTemplate = {
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
            }
            if (index < 0) {
                slides = [ slideTemplate, ...slides]
                index = 0;
            } else {
                slides = [ ...slides, slideTemplate];
                index = slides.length - 1;
            }
        }}>
            <SlideTypeOne/>
        </button>
    </div>
    <div class="container padding flex-center">
        <button class="slide-type-button" on:click={()=>{
            const slideTemplate = {
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
                    {
                        index: 2,
                        text: "",
                    },
                    {
                        index: 3,
                        text: "",
                    },
                ],
                correctAnswer: [0],
            }
            if (index < 0) {
                slides = [ slideTemplate, ...slides]
                index = 0;
            } else {
                slides = [ ...slides, slideTemplate];
                index = slides.length - 1;
            }
        }}>
            <SlideTypeTwo/>
        </button>
    </div>
</section>