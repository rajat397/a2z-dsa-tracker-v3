import { Flex, useToast } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'

import DSA from './components/index.jsx'
import { Reacteroids } from './components/NotFound/Reacteroids.jsx'
import PlannerPage from './components/planner/PlannerPage.jsx'
import { saveAppState } from './components/storage/index.js'

function App({
    fetchData,
    initialPlannerState = null,
    initialStorageMode = 'primary',
    storageWarnings = [],
}) {
    const toast = useToast()
    const [data, setData] = useState(fetchData)
    const [plan, setPlan] = useState(initialPlannerState)
    const [storageMode, setStorageMode] = useState(initialStorageMode)

    useEffect(() => {
        let isCurrent = true

        saveAppState({ tracker: data, planner: plan }).then(result => {
            if (!isCurrent) return

            if (result.reconciled) {
                setData(result.tracker)
                setPlan(result.planner)
            }

            if (result.stale) {
                setStorageMode('conflict')
                if (!toast.isActive('storage-conflict')) {
                    toast({
                        id: 'storage-conflict',
                        title: 'Newer progress exists in another tab',
                        description:
                            'This tab has reconciled the newest local progress. Review it before continuing.',
                        status: 'warning',
                        duration: null,
                        isClosable: true,
                    })
                }
                if (!result.reconciled) window.location.reload()
                return
            }

            setStorageMode(current =>
                current === result.mode ? current : result.mode
            )

            if (result.error) {
                console.error('IndexedDB save failed.', result.error)
            }
            if (result.mirrorError) {
                console.error(
                    'Compatibility storage save failed.',
                    result.mirrorError
                )
            }
        })

        return () => {
            isCurrent = false
        }
    }, [data, plan, toast])

    useEffect(() => {
        storageWarnings.forEach(warning => console.warn(warning))
    }, [storageWarnings])

    return (
        <Routes>
            <Route
                path="/"
                element={
                    <DSA
                        data={data}
                        setData={setData}
                        isHomeScreen={true}
                        selectedContentIndex={0}
                        storageMode={storageMode}
                    />
                }
            />
            <Route
                path="/planly"
                element={
                    <PlannerPage
                        data={data}
                        setData={setData}
                        plan={plan}
                        setPlan={setPlan}
                    />
                }
            />
            {data.data.content.map((contentData, index) => {
                return (
                    <Route
                        key={index}
                        path={contentData.contentPath}
                        element={
                            <DSA
                                data={data}
                                setData={setData}
                                isHomeScreen={false}
                                selectedContentIndex={index}
                                storageMode={storageMode}
                            />
                        }
                    />
                )
            })}
            <Route
                path={'/play'}
                element={
                    <Flex w={'100vw'} h={'100vh'}>
                        <Reacteroids />
                    </Flex>
                }
            />
        </Routes>
    )
}

export default App
