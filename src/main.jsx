import { Button, ChakraProvider, Flex, Spinner, Text } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import chakraTheme from './chakraTheme.js'
import ultimateData from './components/common/enhancedData.js'
import { initializeAppStorage } from './components/storage/index.js'

const rootElement = document.getElementById('root')
if (!rootElement) {
    console.error('Root element not found!')
    document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found</div>'
    throw new Error('Root element not found')
}

const root = ReactDOM.createRoot(rootElement)

function renderWithProviders(children) {
    try {
        root.render(
            <React.StrictMode>
                <ChakraProvider theme={chakraTheme}>
                    <BrowserRouter basename="/a2z-dsa-tracker-v3">{children}</BrowserRouter>
                </ChakraProvider>
            </React.StrictMode>
        )
    } catch (err) {
        console.error('Render error:', err)
        rootElement.innerHTML = `<div style="padding: 20px; color: red;">Render error: ${err.message}</div>`
    }
}

console.log('App starting...')

renderWithProviders(
    <Flex
        minH={'100vh'}
        align={'center'}
        justify={'center'}
        direction={'column'}
        gap={3}
        bg={'fullPageColor'}
    >
        <Spinner color={'highlightedColor'} />
        <Text color={'textColor'}>Loading your saved progress…</Text>
    </Flex>
)

console.log('Loading spinner rendered, initializing storage...')

initializeAppStorage(ultimateData)
    .then(storage => {
        console.log('Storage initialized:', storage.mode, storage.source)
        renderWithProviders(
            <App
                fetchData={storage.tracker}
                initialPlannerState={storage.planner}
                initialStorageMode={storage.mode}
                storageWarnings={storage.warnings}
            />
        )
    })
    .catch(error => {
        console.error('Tracker storage could not be initialized.', error)
        renderWithProviders(
            <Flex
                minH={'100vh'}
                align={'center'}
                justify={'center'}
                direction={'column'}
                gap={3}
                px={6}
                textAlign={'center'}
                bg={'fullPageColor'}
            >
                <Text
                    fontSize={'xl'}
                    fontWeight={'bold'}
                    color={'defaultColor'}
                >
                    Your saved progress could not be loaded safely.
                </Text>
                <Text color={'textColor'}>
                    Reload the page to try opening the local database again.
                </Text>
                <Button
                    colorScheme={'blue'}
                    onClick={() => window.location.reload()}
                >
                    Reload
                </Button>
            </Flex>
        )
    })
