import { Flex, Text } from '@chakra-ui/react'

import { DarkModeToggle } from '../icons/ProjectIcons.jsx'

const Headings = ({ data, setData }) => {
    const heading = 'DSA Tracker'
    const isDarkMode = data.data.header.darkMode
    return (
        <Flex
            className={'headings'}
            w={'100vw'}
            px={6}
            mt={4}
            flexDirection={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
        >
            <DarkModeToggle data={data} setData={setData} toShow={false} />
            <Flex
                flexGrow={1}
                alignItems={'center'}
                justifyContent={'center'}
                gap={2}
            >
                <Text
                    align={'center'}
                    fontWeight={'lg'}
                    fontSize={{ base: '3xl', md: '5xl' }}
                    fontFamily={'customFamily'}
                    fontStyle={'normal'}
                    color={isDarkMode ? 'defaultColor_dark' : 'defaultColor'}
                >
                    {heading}
                </Text>
            </Flex>
            <DarkModeToggle data={data} setData={setData} toShow={true} />
        </Flex>
    )
}

export default Headings
