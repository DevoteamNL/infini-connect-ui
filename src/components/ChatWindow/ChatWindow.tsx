import React, {useEffect, useRef, useState} from 'react';
import {Box, IconButton, List, ListItem, Paper, TextField, Typography} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import PluginSelector from "../PluginSelector/PluginSelector";

// Define the ChatMessage interface for type safety
interface ChatMessage {
    sender: 'user' | 'other';
    text: string;
    timestamp: string;
}

// Define the MainContentProps interface for the component's props
interface MainContentProps {
    selectedPage: string;
}

// MainContent component
const MainContent: React.FC<MainContentProps> = ({selectedPage}) => {
    // Create some mock data for the chat messages
    const mockData: ChatMessage[] = [
        {sender: 'other', text: 'Hello, how can I help you?', timestamp: new Date().toLocaleTimeString()},
        {sender: 'user', text: "Who is Typescript expert?", timestamp: new Date().toLocaleTimeString()},
        // {
        //     sender: 'other',
        //     text: "Sure, TypeScript is a typed superset of JavaScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // }, {
        //     sender: 'other',
        //     text: 'Hello, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help you?',
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'user',
        //     text: "I'm looking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation oking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation on TypeScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'other',
        //     text: "Sure, TypeScript is a typed superset of JavaScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'other',
        //     text: 'Hello, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help you?',
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'user',
        //     text: "I'm looking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation oking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation on TypeScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'other',
        //     text: "Sure, TypeScript is a typed superset of JavaScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // }, {
        //     sender: 'other',
        //     text: 'Hello, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help, how can I help you?',
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'user',
        //     text: "I'm looking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation oking sdfsdf informationinformatiosdfsfds  sdf sdfsfsdf          sdfsdfsdf             sdfsfninformationinformationinformationinformation on TypeScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // },
        // {
        //     sender: 'other',
        //     text: "Sure, TypeScript is a typed superset of JavaScript.",
        //     timestamp: new Date().toLocaleTimeString()
        // }

    ];

    // State for the chat message, chat history, and text field rows
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>(mockData);
    const [rows, setRows] = useState(3);

    // Ref for scrolling to the bottom of the chat
    const chatEndRef = useRef<HTMLDivElement>(null);


    // Effect for handling text field row size based on message content
    useEffect(() => {
        const lineCount = message.split(/\r*\n/).length;
        setRows(Math.max(2, lineCount));
    }, [message]);

    // Effect for auto-scrolling to the latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [chatHistory]);

    // Function to handle sending a message
    const handleSendMessage = () => {
        if (message) {
            setChatHistory([...chatHistory, {
                sender: 'user',
                text: message,
                timestamp: new Date().toLocaleTimeString()
            }]);
            setMessage('');
        }
    };

    // JSX for the MainContent component
    return (
        <Box component="main" sx={{flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', height: '100vh'}}>
            <br/><br/>
            <PluginSelector></PluginSelector>
            <Typography paragraph>{selectedPage}</Typography>
            <Box sx={{flexGrow: 1, overflowY: 'auto'}}>
                <List>
                    {chatHistory.map((msg, index) => (
                        <ListItem key={index} sx={{
                            display: 'flex',
                            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                        }}>
                            <Paper sx={{
                                p: 1,
                                maxWidth: '70%',
                                bgcolor: msg.sender === 'user' ? 'rgba(173, 216, 230, 0.5)' : 'rgba(211, 211, 211, 0.5)',
                                border: 1,
                                borderColor: 'grey.300',
                                borderRadius: 2
                            }}>
                                <Typography variant="body1">{msg.text}</Typography>
                                <Typography variant="caption"
                                            sx={{display: 'block', textAlign: 'right'}}>{msg.timestamp}</Typography>
                            </Paper>
                        </ListItem>
                    ))}
                    <div ref={chatEndRef}/>
                </List>
            </Box>
            <Box sx={{mt: 1}}>
                <TextField fullWidth multiline rows={rows} maxRows={Infinity} label="Type a message" variant="outlined"
                           value={message} onChange={(e) => setMessage(e.target.value)} InputProps={{
                    endAdornment: (<IconButton onClick={handleSendMessage}><SendIcon/></IconButton>)
                }}/>
            </Box>
        </Box>
    );
};

export default MainContent;
