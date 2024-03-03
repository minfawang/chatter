export type ChatChoice = {
    text: String;
}

export type ChatResponse = {
    choices: ChatChoice[];
}

export type ReferenceData = {
    url: string;
    page_title: string;
    text_summary: string;
}
