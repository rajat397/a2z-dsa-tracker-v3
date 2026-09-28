import { Flex, Text } from '@chakra-ui/react'
import { Link } from 'react-router-dom'

const SubHeadings = ({ data, selectedContentIndex }) => {
    const isDarkMode = data.data.header.darkMode
    const contentHeading =
        data.data.content[selectedContentIndex].contentHeading

    return (
        <Flex
            mt={0.5}
            w={'90vw'}
            className={'subHeadings'}
            flexDirection={'column'}
            alignItems={'center'}
            justifyContent={'center'}
        >
            <Flex
                flexDirection={'row'}
                alignItems={'center'}
                justifyContent={'center'}
            >
                <Link to={'/'}>
                    <Text
                        align={'center'}
                        fontWeight={'md'}
                        fontSize={'xl'}
                        fontFamily={'customFamily'}
                        fontStyle={'normal'}
                        color={
                            isDarkMode
                                ? 'highlightedColor_dark'
                                : 'highlightedColor'
                        }
                        cursor={'pointer'}
                        _hover={{ textDecorationLine: 'underline' }}
                    >
                        Topics
                    </Text>
                </Link>
                <Text
                    align={'center'}
                    fontWeight={'md'}
                    fontSize={'xl'}
                    fontFamily={'customFamily'}
                    fontStyle={'normal'}
                    color={isDarkMode ? 'textColor_dark' : 'textColor'}
                >
                    {'/' + contentHeading}
                </Text>
            </Flex>
        </Flex>
    )
}

export default SubHeadings
