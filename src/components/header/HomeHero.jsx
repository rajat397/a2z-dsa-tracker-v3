import { Button, Flex, Grid, Text } from '@chakra-ui/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { DarkModeToggle } from '../icons/ProjectIcons.jsx'
import StorageProtectionStatus from '../storage/StorageProtectionStatus.jsx'

const HomeHero = ({ data, setData, storageMode }) => {
    const isDarkMode = data.data.header.darkMode
    const quotes = data.data.header.motivationalQuotes
    const quote = useMemo(
        () => quotes[Math.floor(Math.random() * quotes.length)],
        [quotes]
    )

    return (
        <Grid
            as={'section'}
            w={'100%'}
            maxW={'1440px'}
            mx={'auto'}
            px={{ base: 4, md: 6, xl: 8 }}
            mt={{ base: 3, md: 5 }}
            templateAreas={{
                base: '"title" "actions" "quote"',
                md: '"title actions" "quote quote"',
                lg: '"title actions quote"',
            }}
            templateColumns={{
                base: 'minmax(0, 1fr)',
                md: 'minmax(0, 1fr) auto',
                lg: 'minmax(0, 1fr) auto minmax(0, 1fr)',
            }}
            alignItems={'start'}
            columnGap={{ lg: 8, xl: 12 }}
            rowGap={{ base: 4, lg: 0 }}
        >
            <Flex
                gridArea={'title'}
                direction={'column'}
                align={'flex-start'}
                justify={'flex-start'}
                gap={2}
            >
                <Text
                    as={'h1'}
                    fontWeight={'lg'}
                    fontSize={{ base: '3xl', md: '4xl', xl: '5xl' }}
                    lineHeight={1.1}
                    fontFamily={'customFamily'}
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                >
                    DSA Tracker
                </Text>
                <Text
                    fontWeight={'md'}
                    fontSize={{ base: 'lg', md: 'xl' }}
                    fontFamily={'customFamily'}
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                >
                    Start Solving 🔥
                </Text>
                <StorageProtectionStatus
                    isDarkMode={isDarkMode}
                    storageMode={storageMode}
                />
            </Flex>

            <Flex
                gridArea={'actions'}
                direction={'column'}
                align={'center'}
                justify={'center'}
                gap={3}
            >
                <Button
                    as={Link}
                    to={'/planly'}
                    size={{ base: 'md', md: 'lg' }}
                    colorScheme={'blue'}
                    borderRadius={'full'}
                    px={{ base: 6, md: 8 }}
                    aria-label={'Plan this sheet with Planly'}
                >
                    Plan with Planly
                </Button>
            </Flex>

            <Flex
                gridArea={'quote'}
                minW={0}
                align={'flex-start'}
                justify={{ base: 'flex-start', md: 'center', lg: 'flex-end' }}
                gap={4}
            >
                <Text
                    maxW={'480px'}
                    align={{ base: 'left', md: 'center', lg: 'right' }}
                    fontWeight={'md'}
                    fontSize={{ base: 'sm', md: 'md', xl: 'lg' }}
                    lineHeight={1.5}
                    fontFamily={'customFamily'}
                    color={isDarkMode ? 'textColor_dark' : 'textColor'}
                    noOfLines={3}
                >
                    {'" ' + quote.quote + ' " - ' + quote.author}
                </Text>
                <DarkModeToggle data={data} setData={setData} toShow={true} />
            </Flex>
        </Grid>
    )
}

export default HomeHero
