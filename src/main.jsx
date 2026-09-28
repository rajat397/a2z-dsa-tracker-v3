import { Button, ChakraProvider, Flex, Spinner, Text } from '@chakra-ui/react'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import chakraTheme from './chakraTheme.js'
import ultimateData from './components/common/enhancedData.js'
import { initializeAppStorage } from './components/storage/index.js'

const root = ReactDOM.createRoot(document.getElementById('root'))

const renderWithProviders = children =>
    root.render(
        <React.StrictMode>
            <ChakraProvider theme={chakraTheme}>
                <BrowserRouter>{children}</BrowserRouter>
            </ChakraProvider>
        </React.StrictMode>
    )

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

initializeAppStorage(ultimateData)
    .then(storage => {
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
