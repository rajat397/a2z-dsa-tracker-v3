import ultimateData from './ultimateData.js'
import articleUrlMap from './articleUrlMap.js'
import gfgArticleByQuestionId from './gfgArticleByQuestionId.js'
import officialArticleByTitle from './officialArticleByTitle.js'
import officialArticleByQuestionId from './officialArticleByQuestionId.js'

const addedQuestionsByPath = {
    '/array': [
        {
            questionHeading: "Pascal's Triangle II",
            leetCodeLink: 'https://leetcode.com/problems/pascals-triangle-ii/',
            articleLink:
                'https://takeuforward.org/blogs/data-structure-and-algorithm/pascals-triangle-first-n-rows',
        },
        {
            questionHeading: "Pascal's Triangle III",
            leetCodeLink: 'https://leetcode.com/problems/pascals-triangle/',
            articleLink:
                'https://takeuforward.org/blogs/data-structure-and-algorithm/pascals-triangle-first-n-rows',
        },
        {
            questionHeading: 'Count subarrays with given sum',
            leetCodeLink:
                'https://leetcode.com/problems/subarray-sum-equals-k/',
            articleLink:
                'https://takeuforward.org/arrays/count-subarray-sum-equals-k',
        },
    ],
    '/binary_search': [
        {
            questionHeading: 'Floor and Ceil in Sorted Array',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/ceil-the-floor2802/1',
            articleLink:
                'https://takeuforward.org/arrays/floor-and-ceil-in-sorted-array',
        },
        {
            questionHeading: "Painter's Partition",
            gfgLink:
                'https://www.geeksforgeeks.org/problems/the-painters-partition-problem1535/1',
            articleLink:
                'https://takeuforward.org/arrays/painters-partition-problem',
        },
    ],
    '/linked_list': [
        {
            questionHeading: 'Deletion of the head of LL',
            code360Link:
                'https://www.naukri.com/code360/problems/delete-head-of-a-given-linked-list_9941216',
            articleLink:
                'https://takeuforward.org/data-structure/delete-head-node-of-linked-list',
        },
        {
            questionHeading: 'Deletion of the tail of Linked List',
            code360Link:
                'https://www.naukri.com/code360/problems/delete-node-of-linked-list_8160463',
            articleLink:
                'https://takeuforward.org/data-structure/delete-last-node-of-linked-list/',
        },
        {
            questionHeading: 'Deletion of the Kth element of Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/delete-a-node-in-single-linked-list/1',
            articleLink:
                'https://takeuforward.org/linked-list/delete-the-kth-element-of-a-linked-list',
        },
        {
            questionHeading: 'Delete the element with value X',
            leetCodeLink:
                'https://leetcode.com/problems/remove-linked-list-elements/',
        },
        {
            questionHeading: 'Insertion at the head of Linked List',
            articleLink:
                'https://takeuforward.org/data-structure/insert-node-at-beginning-of-linked-list',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/insertion-at-a-given-position-in-a-linked-list/1',
        },
        {
            questionHeading: 'Insertion at the tail of Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/insertion-at-a-given-position-in-a-linked-list/1',
            articleLink:
                'https://takeuforward.org/data-structure/insert-node-at-end-of-linked-list',
        },
        {
            questionHeading: 'Insertion at the Kth position of Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/insertion-at-a-given-position-in-a-linked-list/1',
            articleLink:
                'https://takeuforward.org/linked-list/insert-before-the-kth-element-of-the-linked-list',
        },
        {
            questionHeading: 'Insertion before the value X in Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/dsa/insertion-in-linked-list/',
            articleLink:
                'https://takeuforward.org/linked-list/insert-before-the-node-with-value-x-of-the-linked-list',
        },
        {
            questionHeading: 'Convert Array to Doubly Linked List',
            code360Link:
                'https://www.naukri.com/code360/problems/introduction-to-doubly-linked-list_8160413',
            articleLink:
                'https://takeuforward.org/arrays/convert-an-array-to-a-doubly-linked-list',
        },
        {
            questionHeading: 'Delete Tail of Doubly Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/delete-node-in-doubly-linked-list/1',
            articleLink:
                'https://takeuforward.org/data-structure/delete-last-node-of-a-doubly-linked-list',
        },
        {
            questionHeading: 'Delete Kth Element of Doubly Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/delete-node-in-doubly-linked-list/1',
            articleLink:
                'https://takeuforward.org/doubly-linked-list/delete-the-kth-node-of-a-doubly-linked-list',
        },
        {
            questionHeading: 'Removing given node in Doubly Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/dsa/delete-a-node-in-a-doubly-linked-list/',
            articleLink:
                'https://takeuforward.org/doubly-linked-list/delete-the-given-node-from-the-doubly-linked-list',
        },
        {
            questionHeading: 'Insert node before head in Doubly Linked List',
            code360Link:
                'https://www.naukri.com/code360/problems/insertion-in-doubly-linked-list_4609682',
            articleLink:
                'https://takeuforward.org/doubly-linked-list/insertion-at-the-head-of-a-doubly-linked-list',
        },
        {
            questionHeading: 'Insert node before tail in Doubly Linked List',
            code360Link:
                'https://www.naukri.com/code360/problems/insert-at-end-of-doubly-linked-list_10491197',
            articleLink:
                'https://takeuforward.org/doubly-linked-list/insert-before-the-tail-of-a-doubly-linked-list',
        },
        {
            questionHeading:
                'Insert node before (kth node) in Doubly Linked List',
            code360Link:
                'https://www.naukri.com/code360/problems/insertion-in-doubly-linked-list_4609682',
        },
        {
            questionHeading: 'Insert before given node in Doubly Linked List',
            gfgLink:
                'https://www.geeksforgeeks.org/dsa/introduction-and-insertion-in-a-doubly-linked-list/',
            articleLink:
                'https://takeuforward.org/doubly-linked-list/insert-before-a-given-node-of-a-dll',
        },
        {
            questionHeading: 'Merge two Sorted Lists',
            leetCodeLink:
                'https://leetcode.com/problems/merge-two-sorted-lists/',
            articleLink:
                'https://takeuforward.org/blogs/data-structure-and-algorithm/merge-two-sorted-linked-lists',
        },
    ],
    '/bit_manipulation': [
        {
            questionHeading: 'Single Number - II',
            leetCodeLink: 'https://leetcode.com/problems/single-number-ii/',
            articleLink:
                'https://takeuforward.org/bit-manipulation/single-number-ii',
        },
    ],
    '/two_pointers': [
        {
            questionHeading: 'Sliding Window / Two Pointer — Theory',
            gfgLink:
                'https://www.geeksforgeeks.org/dsa/window-sliding-technique/',
        },
    ],
    '/stack_n_queue': [
        {
            questionHeading: 'Implementation using different DS',
            gfgLink: 'https://www.geeksforgeeks.org/dsa/stack-data-structure/',
            articleLink:
                'https://takeuforward.org/data-structure/implement-stack-using-array',
        },
    ],
    '/binary_tree': [
        {
            questionHeading: 'Print root to leaf path in BT',
            leetCodeLink: 'https://leetcode.com/problems/binary-tree-paths/',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/root-to-leaf-paths/1',
        },
    ],
    '/binary_search_tree': [
        {
            questionHeading: 'BST iterator',
            leetCodeLink:
                'https://leetcode.com/problems/binary-search-tree-iterator/',
            articleLink:
                'https://takeuforward.org/data-structure/binary-search-tree-iterator',
        },
    ],
    '/heaps': [
        {
            questionHeading: 'Heapify Algorithm',
            gfgLink: 'https://www.geeksforgeeks.org/dsa/binary-heap/',
            articleLink:
                'https://takeuforward.org/heap/binary-heap-heapify-and-extract-min',
        },
        {
            questionHeading: 'Build heap from a given Array',
            code360Link:
                'https://www.naukri.com/code360/problems/build-heap_975375',
            articleLink:
                'https://takeuforward.org/heap/buildheap-decreasekey-and-delete-in-binary-heap',
        },
        {
            questionHeading: 'Heap Sort',
            gfgLink: 'https://www.geeksforgeeks.org/problems/heap-sort/1',
            articleLink: 'https://takeuforward.org/data-structure/heap-sort',
        },
    ],
    '/graphs': [
        {
            questionHeading: 'Print Shortest Path',
            gfgLink:
                'https://www.geeksforgeeks.org/problems/shortest-path-in-weighted-undirected-graph/1',
            articleLink:
                'https://takeuforward.org/data-structure/g-35-print-shortest-path-dijkstras-algorithm/',
        },
    ],
}

const existingLinkOverrides = {
    '2_majority_element_(>n/2_times)': {
        articleLink:
            'https://takeuforward.org/blogs/data-structure-and-algorithm/majority-element-n-by-2',
    },
    '1_find_the_highest/lowest_frequency_element': {
        code360Link:
            'https://www.naukri.com/code360/problems/k-most-occurrent-numbers_625382',
    },
    '7_aggressive_cows': {
        leetCodeLink:
            'https://leetcode.com/problems/magnetic-force-between-two-balls/',
        code360Link:
            'https://www.naukri.com/code360/problems/aggressive-cows_1082559',
    },
    '8_find_the_repeating_and_missing_number': {
        leetCodeLink: 'https://leetcode.com/problems/set-mismatch/',
    },
    '2_matrix_median': {
        leetCodeLink:
            'https://leetcode.com/problems/median-of-a-row-wise-sorted-matrix/',
    },
    '0_find_square_root_of_a_number_in_log_n': {
        leetCodeLink: 'https://leetcode.com/problems/sqrtx/',
    },
    '8_book_allocation_problem': {
        leetCodeLink: 'https://leetcode.com/problems/split-array-largest-sum/',
    },
    '0_search_in_a_2d_matrix_': {
        questionHeading: 'Search in 2D Matrix - II',
        leetCodeLink: 'https://leetcode.com/problems/search-a-2d-matrix-ii/',
        gfgLink: '',
    },
    '8_search_in_rotated_sorted_array_i': {
        leetCodeLink:
            'https://leetcode.com/problems/search-in-rotated-sorted-array/',
        gfgLink:
            'https://www.geeksforgeeks.org/problems/search-in-a-rotated-array4618/1',
    },
    '13_add_1_to_a_number_represented_by_ll': {
        leetCodeLink: 'https://leetcode.com/problems/plus-one-linked-list/',
    },
    '3_find_the_length_of_the_linkedlist_[learn_traversal]': {
        code360Link:
            'https://www.naukri.com/code360/problems/length-of-ll_5884',
    },
    '4_search_an_element_in_the_linkedlist': {
        code360Link:
            'https://www.naukri.com/code360/problems/search-in-a-linked-list_975381',
    },
    '1_insert_a_node_in_dll': {
        gfgLink:
            'https://www.geeksforgeeks.org/problems/insert-a-node-in-doubly-linked-list/1',
    },
    '2_delete_a_node_in_dll': {
        gfgLink:
            'https://www.geeksforgeeks.org/problems/delete-node-in-doubly-linked-list/1',
    },
    '0_delete_all_occurrences_of_a_key_in_dll': {
        gfgLink:
            'https://www.geeksforgeeks.org/problems/delete-all-occurrences-of-a-given-key-in-a-doubly-linked-list/1',
    },
    '2_remove_duplicates_from_sorted_dll': {
        code360Link:
            'https://www.naukri.com/code360/problems/unique-sorted-list_2420283',
    },
    '5_check_if_there_exists_a_subsequence_with_sum_k': {
        gfgLink:
            'https://www.geeksforgeeks.org/problems/check-if-there-exists-a-subsequence-with-sum-k/1',
    },
    '3_find_xor_of_numbers_from_l_to_r': {
        code360Link:
            'https://www.naukri.com/code360/problems/l-to-r-xor_8160412',
    },
    '1_all_divisors_of_a_number': {
        code360Link:
            'https://www.naukri.com/code360/problems/find-all-divisors-of-a-natural-number_5587903',
    },
    '3_find_prime_factorisation_of_a_number_using_sieve': {
        gfgLink: 'https://www.geeksforgeeks.org/problems/prime-factorization/1',
    },
    '1_prefix_to_infix_conversion': {
        code360Link:
            'https://www.naukri.com/code360/problems/prefix-to-infix_1215000',
    },
    '2_prefix_to_postfix_conversion': {
        code360Link:
            'https://www.naukri.com/code360/problems/convert-prefix-to-postfix_8391014',
    },
    '3_postfix_to_prefix_conversion': {
        code360Link:
            'https://www.naukri.com/code360/problems/postfix-to-prefix_1788455',
    },
    '4_postfix_to_infix': {
        code360Link:
            'https://www.naukri.com/code360/problems/postfix-to-infix_8382386',
    },
    '3_number_of_nges_to_the_right': {
        code360Link:
            'https://www.naukri.com/code360/problems/count-of-greater-elements-to-the-right_8365436',
    },
    '2_fruit_into_baskets': {
        leetCodeLink: 'https://leetcode.com/problems/fruit-into-baskets/',
    },
    '0_sort_characters_by_frequency': {
        gfgLink: '',
    },
    '2_count_good_numbers': {
        gfgLink: '',
    },
    '4_course_schedule_–_ii': {
        gfgLink: '',
    },
    '4_valid_paranthesis_checker': {
        leetCodeLink: 'https://leetcode.com/problems/valid-parentheses/',
    },
    '3_convert_min_heap_to_max_heap': {
        code360Link:
            'https://www.naukri.com/code360/problems/convert-min-heap-to-max-heap_630293',
    },
    '4_replace_each_array_element_by_its_corresponding_rank': {
        leetCodeLink:
            'https://leetcode.com/problems/rank-transform-of-an-array/',
        code360Link:
            'https://www.naukri.com/code360/problems/replace-each-element-of-array-with-its-corresponding-rank_975384',
    },
    '1_connect_`n`_ropes_with_minimal_cost': {
        leetCodeLink:
            'https://leetcode.com/problems/minimum-cost-to-connect-sticks/',
    },
    '12_largest_bst_in_binary_tree': {
        leetCodeLink: 'https://leetcode.com/problems/largest-bst-subtree/',
    },
    '3_connected_components_|_logic_explanation': {
        leetCodeLink: 'https://leetcode.com/problems/number-of-provinces/',
    },
    '1_connected_components_problem_in_matrix': {
        leetCodeLink: 'https://leetcode.com/problems/number-of-provinces/',
    },
    '0_minimum_spanning_tree': {
        leetCodeLink:
            'https://leetcode.com/problems/connecting-cities-with-minimum-cost/',
    },
    '3_maximum_sum_of_non-adjacent_elements_(dp_5)': {
        leetCodeLink: 'https://leetcode.com/problems/house-robber/',
    },
    '4_house_robber_(dp_6)': {
        leetCodeLink: 'https://leetcode.com/problems/house-robber-ii/',
    },
    '3_maximum_sum_combination': {
        code360Link:
            'https://www.naukri.com/code360/problems/k-max-sum-combinations_975322',
    },
    '6_program_for_shortest_job_first_(or_sjf)_cpu_scheduling': {
        code360Link: 'https://www.naukri.com/code360/problems/sjf_1172165',
    },
    '3_binary_tree_traversals_in_binary_tree_': {
        code360Link: 'https://www.naukri.com/code360/problems/981269',
    },
    '1_floor_in_a_binary_search_tree': {
        code360Link:
            'https://www.naukri.com/code360/problems/floor-from-bst_920457',
    },
    '0_shortest_path_in_ug_with_unit_weights': {
        code360Link:
            'https://www.naukri.com/code360/problems/single-source-shortest-path_8416371',
    },
    '1_shortest_path_in_dag': {
        code360Link:
            'https://www.naukri.com/code360/problems/shortest-path-in-dag_8381897',
    },
    '1_frog_jump(dp-3)': {
        code360Link:
            'https://www.naukri.com/code360/problems/frog-jump_3621012',
    },
    '2_frog_jump_with_k_distances(dp-4)': {
        gfgLink: 'https://www.geeksforgeeks.org/problems/minimal-cost/1',
    },
    '0_ninja’s_training_(dp_7)': {
        gfgLink: 'https://www.geeksforgeeks.org/problems/geeks-training/1',
    },
    '6_3d_dp_:_ninja_and_his_friends_(dp-13)': {
        leetCodeLink: 'https://leetcode.com/problems/cherry-pickup-ii/',
        gfgLink: 'https://www.geeksforgeeks.org/problems/chocolates-pickup/1',
    },
    '4_count_partitions_with_given_difference_(dp_–_18)': {
        leetCodeLink: 'https://leetcode.com/problems/target-sum/',
        code360Link:
            'https://www.naukri.com/code360/problems/partitions-with-given-difference_3751628',
    },
    '2_longest_increasing_subsequence_|(dp-43)': {
        leetCodeLink:
            'https://leetcode.com/problems/longest-increasing-subsequence/',
    },
    '0_implement_trie_–_2_(prefix_tree)': {
        leetCodeLink:
            'https://leetcode.com/problems/implement-trie-ii-prefix-tree/',
    },
    '1_longest_string_with_all_prefixes': {
        leetCodeLink:
            'https://leetcode.com/problems/longest-word-in-dictionary/',
    },
    '1_printing_longest_increasing_subsequence|(dp-42)': {
        code360Link:
            'https://www.naukri.com/code360/problems/printing-longest-increasing-subsequence_8360670',
    },
}

function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
}

function createQuestion(question, index) {
    return {
        questionHeading: question.questionHeading,
        questionLink: '',
        articleLink: question.articleLink || '',
        gfgLink: question.gfgLink || '',
        leetCodeLink: question.leetCodeLink || '',
        code360Link: question.code360Link || '',
        youTubeLink: question.youTubeLink || '',
        isDone: false,
        isBookmarked: false,
        userNotes: '',
        questionIndex: index,
        questionId: `added_${index}_${slugify(question.questionHeading)}`,
    }
}

function enhanceData() {
    const data = JSON.parse(JSON.stringify(ultimateData))

    data.data.content.forEach(content => {
        const additions = addedQuestionsByPath[content.contentPath]
        if (!additions) return

        const categoryId =
            Math.max(
                ...content.categoryList.map(category => category.categoryId)
            ) + 1
        const questionList = additions.map(createQuestion)

        content.categoryList.push({
            categoryId,
            categoryName: 'Added from the live Striver sheet',
            categoryTotalQuestions: questionList.length,
            categoryCompletedQuestions: 0,
            questionList,
        })
    })

    data.data.content.forEach(content => {
        content.categoryList.forEach(category => {
            category.questionList.forEach(question => {
                const override = existingLinkOverrides[question.questionId]
                if (override) Object.assign(question, override)

                const sourceArticleLink =
                    question.articleLink || question.questionLink
                const exactOfficialArticle =
                    officialArticleByTitle[question.questionHeading.trim()]
                question.articleLink =
                    officialArticleByQuestionId[question.questionId] ||
                    exactOfficialArticle ||
                    (!question.questionId.startsWith('added_')
                        ? articleUrlMap[sourceArticleLink]
                        : '') ||
                    ''

                if (!Object.hasOwn(question, 'code360Link')) {
                    question.code360Link = ''
                }

                question.gfgArticleLink =
                    gfgArticleByQuestionId[question.questionId] || ''
            })

            category.categoryTotalQuestions = category.questionList.length
        })

        content.contentTotalQuestions = content.categoryList.reduce(
            (total, category) => total + category.questionList.length,
            0
        )
    })

    data.data.header.totalQuestions = data.data.content.reduce(
        (total, content) => total + content.contentTotalQuestions,
        0
    )

    return data
}

const enhancedData = enhanceData()

export default enhancedData
