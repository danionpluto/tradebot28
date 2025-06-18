# tradingchatbot

Deployed here: https://tradebot28-816dee9b3158.herokuapp.com/

This chatbot is a protoype chatbot meant to interact with a sample dataset of trades. 

The dataset was cleaned and basic data analysis was performed to determine things like net total loss, max profit trade, number of trades, etc. 

Open AI API was given the analysis and summary and used to process the natural language questions provided by the user, with questions like "What advice would you give this trader to better manage their risk?" in mind. The analysis and summary were given in the prompt to the API to try to minimize error on mathematical calculation and the script to analyze them could be used for any file with a similar csv structure. 

Future Steps: 

Add authentification to allow for users to track their trades month by month.

Providing data visualization of the month's trades upon load of the chatbot. 

Provide current market trends upon load of page.