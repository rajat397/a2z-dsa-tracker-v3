import { Flex } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import Content from './content/Content.jsx'
import Header from './header/Header.jsx'

const DSA = ({
    data,
    setData,
    isHomeScreen,
    selectedContentIndex,
    storageMode,
}) => {
    let [searchValue, setSearchValue] = useState('')
    const location = useLocation()
    const isDarkMode = data.data.header.darkMode
    const focusedQuestionId = new URLSearchParams(location.search).get(
        'question'
    )

    useEffect(() => {
        if (isHomeScreen || !focusedQuestionId) return undefined

        let highlightTimeout
        const frame = window.requestAnimationFrame(() => {
            const element = document.getElementById(focusedQuestionId)
            if (!element) return

            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            const highlightClass = isDarkMode ? 'blink_dark' : 'blink'
            element.classList.add(highlightClass)
            highlightTimeout = window.setTimeout(
                () => element.classList.remove(highlightClass),
                1400
            )
        })

        return () => {
            window.cancelAnimationFrame(frame)
            if (highlightTimeout) window.clearTimeout(highlightTimeout)
        }
    }, [focusedQuestionId, isDarkMode, isHomeScreen, selectedContentIndex])

    return (
        <Flex
            className={'app'}
            w={'100vw'}
            h={'100vh'}
            flexDirection={'column'}
            alignItems={'center'}
            justifyContent={'space-between'}
            bg={isDarkMode ? 'fullPageColor_dark' : 'fullPageColor'}
        >
            <Header
                data={data}
                setData={setData}
                isHomeScreen={isHomeScreen}
                selectedContentIndex={selectedContentIndex}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                storageMode={storageMode}
            />
            <Content
                data={data}
                setData={setData}
                isHomeScreen={isHomeScreen}
                selectedContentIndex={selectedContentIndex}
                searchValue={searchValue}
                focusedQuestionId={focusedQuestionId}
            />
        </Flex>
    )
}

export default DSA
