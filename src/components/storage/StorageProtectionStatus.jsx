import { CheckCircleIcon, InfoOutlineIcon, LockIcon } from '@chakra-ui/icons'
import {
    Box,
    Button,
    Flex,
    Icon,
    Spinner,
    Text,
    useToast,
} from '@chakra-ui/react'
import { useEffect, useId, useRef, useState } from 'react'

import {
    getStoragePersistenceStatus,
    requestStoragePersistence,
} from './storagePersistence.js'

const STORAGE_STATUS = {
    CHECKING: 'checking',
    CONFLICT: 'conflict',
    DEGRADED: 'degraded',
    DENIED: 'denied',
    ERROR: 'error',
    PERSISTENT: 'persistent',
    REQUESTING: 'requesting',
    STANDARD: 'standard',
    UNSUPPORTED: 'unsupported',
}

const statusCopy = {
    [STORAGE_STATUS.CHECKING]: 'Checking browser protection…',
    [STORAGE_STATUS.CONFLICT]:
        'Newest local progress was merged. Review before continuing.',
    [STORAGE_STATUS.DEGRADED]:
        'IndexedDB is unavailable; using the compatibility copy.',
    [STORAGE_STATUS.DENIED]:
        'Saved locally; browser protection was not granted.',
    [STORAGE_STATUS.ERROR]:
        'Saved locally; protection status could not be checked.',
    [STORAGE_STATUS.PERSISTENT]: 'Protected from automatic browser cleanup.',
    [STORAGE_STATUS.REQUESTING]: 'Requesting browser protection…',
    [STORAGE_STATUS.STANDARD]: 'Saved locally with standard browser storage.',
    [STORAGE_STATUS.UNSUPPORTED]:
        'Saved locally; extra browser protection is unavailable.',
}

const StorageProtectionStatus = ({
    isDarkMode = false,
    onProtectionChange,
    storageMode = 'primary',
}) => {
    const toast = useToast()
    const descriptionId = useId()
    const onProtectionChangeRef = useRef(onProtectionChange)
    const [indexedDbAvailable, setIndexedDbAvailable] = useState(null)
    const [status, setStatus] = useState(STORAGE_STATUS.CHECKING)

    useEffect(() => {
        onProtectionChangeRef.current = onProtectionChange
    }, [onProtectionChange])

    useEffect(() => {
        let isCurrent = true

        const checkProtection = async () => {
            const hasIndexedDb =
                typeof window !== 'undefined' && 'indexedDB' in window
            if (isCurrent) setIndexedDbAvailable(hasIndexedDb)

            if (storageMode === 'degraded') {
                if (isCurrent) setStatus(STORAGE_STATUS.DEGRADED)
                return
            }
            if (storageMode === 'conflict') {
                if (isCurrent) setStatus(STORAGE_STATUS.CONFLICT)
                return
            }

            const persistence = await getStoragePersistenceStatus()
            if (!isCurrent) return

            if (!persistence.supported) {
                if (isCurrent) setStatus(STORAGE_STATUS.UNSUPPORTED)
                return
            }

            if (persistence.error) {
                setStatus(STORAGE_STATUS.ERROR)
                return
            }

            setStatus(
                persistence.persisted
                    ? STORAGE_STATUS.PERSISTENT
                    : STORAGE_STATUS.STANDARD
            )
            onProtectionChangeRef.current?.(persistence.persisted)
        }

        checkProtection()

        return () => {
            isCurrent = false
        }
    }, [storageMode])

    const requestProtection = async () => {
        setStatus(STORAGE_STATUS.REQUESTING)
        const persistence = await requestStoragePersistence()

        if (!persistence.supported) {
            setStatus(STORAGE_STATUS.UNSUPPORTED)
            toast({
                title: 'Browser protection is unavailable',
                description:
                    'Your progress still saves locally in IndexedDB on this device.',
                status: 'info',
                duration: 5000,
                isClosable: true,
            })
            return
        }

        if (persistence.error) {
            setStatus(STORAGE_STATUS.ERROR)
            onProtectionChangeRef.current?.(false)
            toast({
                title: 'Could not enable protection',
                description:
                    'Your progress still saves locally. You can try protecting it again.',
                status: 'error',
                duration: 6000,
                isClosable: true,
            })
            return
        }

        if (persistence.persisted) {
            setStatus(STORAGE_STATUS.PERSISTENT)
            onProtectionChangeRef.current?.(true)
            toast({
                title: 'Local data protected',
                description:
                    'The browser will avoid automatically clearing this site’s IndexedDB data.',
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
            return
        }

        setStatus(STORAGE_STATUS.DENIED)
        onProtectionChangeRef.current?.(false)
        toast({
            title: 'Protection was not granted',
            description:
                'Your progress still saves locally in IndexedDB. The browser controls whether persistent storage is granted.',
            status: 'warning',
            duration: 6000,
            isClosable: true,
        })
    }

    const isBusy =
        status === STORAGE_STATUS.CHECKING ||
        status === STORAGE_STATUS.REQUESTING
    const canRequest = [
        STORAGE_STATUS.DENIED,
        STORAGE_STATUS.ERROR,
        STORAGE_STATUS.STANDARD,
    ].includes(status)
    const showProtectionAction =
        canRequest || status === STORAGE_STATUS.REQUESTING
    const isProtected = status === STORAGE_STATUS.PERSISTENT
    const iconColor = isProtected
        ? 'green.500'
        : status === STORAGE_STATUS.DEGRADED
          ? 'orange.500'
          : status === STORAGE_STATUS.CONFLICT
            ? 'orange.500'
            : isDarkMode
              ? 'highlightedColor_dark'
              : 'highlightedColor'

    return (
        <Box
            w={'fit-content'}
            maxW={'100%'}
            px={3}
            py={2}
            bg={isDarkMode ? 'topicStillBg_dark' : 'secondaryColor'}
            border={'1px solid'}
            borderColor={isDarkMode ? 'borderColor_dark' : 'gray.200'}
            borderRadius={'lg'}
            boxShadow={'sm'}
        >
            <Flex align={'center'} gap={2.5} wrap={'wrap'}>
                <Flex align={'center'} gap={2} minW={0}>
                    {isBusy ? (
                        <Spinner
                            size={'xs'}
                            color={iconColor}
                            flexShrink={0}
                            aria-hidden={'true'}
                        />
                    ) : (
                        <Icon
                            as={isProtected ? CheckCircleIcon : InfoOutlineIcon}
                            color={iconColor}
                            boxSize={3.5}
                            flexShrink={0}
                            aria-hidden={'true'}
                        />
                    )}
                    <Box minW={0}>
                        <Text
                            fontSize={'xs'}
                            lineHeight={1.25}
                            fontWeight={'semibold'}
                            color={
                                isDarkMode
                                    ? 'defaultColor_dark'
                                    : 'defaultColor'
                            }
                        >
                            {indexedDbAvailable === false
                                ? 'Local database unavailable'
                                : status === STORAGE_STATUS.DEGRADED
                                  ? 'Compatibility saving only'
                                  : status === STORAGE_STATUS.CONFLICT
                                    ? 'Newer progress in another tab'
                                    : 'IndexedDB local saving'}
                        </Text>
                        <Text
                            id={descriptionId}
                            role={'status'}
                            aria-live={'polite'}
                            fontSize={'xs'}
                            lineHeight={1.35}
                            color={isDarkMode ? 'textColor_dark' : 'textColor'}
                        >
                            {indexedDbAvailable === false
                                ? 'This browser cannot store tracker progress in IndexedDB.'
                                : statusCopy[status]}
                        </Text>
                    </Box>
                </Flex>

                {showProtectionAction && indexedDbAvailable !== false && (
                    <Button
                        size={'xs'}
                        variant={'outline'}
                        colorScheme={'blue'}
                        borderRadius={'full'}
                        leftIcon={<LockIcon boxSize={3} />}
                        onClick={requestProtection}
                        isLoading={status === STORAGE_STATUS.REQUESTING}
                        loadingText={'Protecting'}
                        aria-describedby={descriptionId}
                    >
                        Protect local data
                    </Button>
                )}
            </Flex>
        </Box>
    )
}

export { STORAGE_STATUS }
export default StorageProtectionStatus
