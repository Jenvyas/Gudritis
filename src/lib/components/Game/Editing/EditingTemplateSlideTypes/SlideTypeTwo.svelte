<style>
    .slide-type {
        display:flex;
        flex-direction: column;
        background-color: black;
        aspect-ratio: 4/3;
        border-radius: 5px;
    }
    .container {
        flex: 1 0 40%;
    }
    .padding {
        padding: 1%;
    }
    .question-outline {
        border-radius: 5px;
        background-color: white;
        width:100%;
        height:100%;
    }
    .answer-outline {
        border-radius: 5px;
        background-color: white;
        width:100%;
        height:100%;
    }
    .answer-section-outline {
        width:100%;
        height:100%;
        display:flex;
        flex-wrap: wrap;
    }
    </style>
    
    <div class="slide-type">
        <div class="container padding">
            <div class="question-outline"></div>
        </div>
        <div class="container">
            <div class="answer-section-outline">
                <div class="container padding">
                    <div class="answer-outline"></div>
                </div>
                <div class="container padding">
                    <div class="answer-outline"></div>
                </div>
                <div class="container padding">
                    <div class="answer-outline"></div>
                </div>
                <div class="container padding">
                    <div class="answer-outline"></div>
                </div>
            </div>
        </div>
    </div>