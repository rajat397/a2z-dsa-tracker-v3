import { Flex } from '@chakra-ui/react'

import GlobalQuestionSearch from '../search/GlobalQuestionSearch.jsx'
import Ads from './Ads.jsx'
import Headings from './Headings.jsx'
import HomeHero from './HomeHero.jsx'
import SearchBar from './SearchBar.jsx'
import SubHeadings from './SubHeadings.jsx'
import TotalProgressBar from './TotalProgressBar.jsx'

const Header = ({
    data,
    setData,
    isHomeScreen,
    selectedContentIndex,
    searchValue,
    setSearchValue,
    storageMode,
}) => {
    const numberOfTotalCompletedQuestions = data.data.header.completedQuestions
    return (
        <Flex
            className={'header'}
            w={'100%'}
            flexGrow={'0'}
            flexDirection={'column'}
            alignItems={'center'}
            justifyContent={'center'}
            userSelect={'none'}
        >
            <Ads data={data} />
            {isHomeScreen ? (
                <>
                    <HomeHero
                        data={data}
                        setData={setData}
                        storageMode={storageMode}
                    />
                    <GlobalQuestionSearch data={data} />
                    {numberOfTotalCompletedQuestions > 0 && (
                        <TotalProgressBar data={data} />
                    )}
                </>
            ) : (
                <>
                    <Headings data={data} setData={setData} />
                    <SubHeadings
                        data={data}
                        selectedContentIndex={selectedContentIndex}
                    />
                    <SearchBar
                        data={data}
                        setData={setData}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        selectedContentIndex={selectedContentIndex}
                    />
                </>
            )}
        </Flex>
    )
}

export default Header
