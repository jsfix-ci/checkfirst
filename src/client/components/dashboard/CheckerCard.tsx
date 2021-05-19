import React, { FC, useRef } from 'react'
import moment from 'moment-timezone'
import { useQueryClient, useMutation } from 'react-query'
import { useHistory, useRouteMatch, Link } from 'react-router-dom'
import { BiDuplicate, BiTrash, BiDotsHorizontalRounded } from 'react-icons/bi'
import {
  CSSObject,
  Box,
  useOutsideClick,
  useDisclosure,
  useMultiStyleConfig,
  useToast,
  Text,
  VStack,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react'

import { DashboardCheckerDTO } from '../../../types/checker'
import { getApiErrorMessage } from '../../api'
import { CheckerService } from '../../services'
import { ConfirmDialog } from '../ConfirmDialog'

type CheckerCardProps = {
  checker: DashboardCheckerDTO
}

type StatusIndicatorProps = {
  status: 'published' | 'draft'
}

const StatusIndicator: FC<StatusIndicatorProps> = ({ status }) => {
  const styles = useMultiStyleConfig('CheckerCard', {})
  const color = status === 'published' ? '#46DBC9' : '#ECC953'

  return (
    <Flex sx={styles.indicator} direction="row">
      <Box h="8px" w="8px" borderRadius="4px" bg={color} mr="8px" />
      {status}
    </Flex>
  )
}

type ActionMenuProps = {
  actions: Array<{
    label: string
    onClick: (e: React.MouseEvent) => void
    icon?: JSX.Element
    style?: CSSObject
  }>
}

const ActionMenu: FC<ActionMenuProps> = ({ actions }) => {
  const ref = useRef(null)
  const { isOpen, onClose, onToggle } = useDisclosure()
  useOutsideClick({
    ref,
    handler: () => onClose(),
  })

  return (
    <div ref={ref}>
      <Menu isOpen={isOpen}>
        <MenuButton
          as={IconButton}
          icon={<BiDotsHorizontalRounded />}
          onClick={(e) => {
            e.preventDefault()
            onToggle()
          }}
          variant="ghost"
        >
          Click
        </MenuButton>
        <MenuList>
          {actions.map(({ onClick, label, icon, style }, i) => (
            <MenuItem
              key={i}
              icon={icon}
              sx={style}
              onClick={(e) => {
                e.preventDefault()
                onClose()
                onClick(e)
              }}
            >
              {label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </div>
  )
}

export const CheckerCard: FC<CheckerCardProps> = ({ checker }) => {
  const history = useHistory()
  const { path } = useRouteMatch()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast({ position: 'bottom-right', variant: 'solid' })
  const styles = useMultiStyleConfig('CheckerCard', {})

  const queryClient = useQueryClient()
  const deleteChecker = useMutation(CheckerService.deleteChecker, {
    onSuccess: () => {
      queryClient.invalidateQueries('checkers')
      toast({
        status: 'success',
        title: 'Checker deleted',
        description: `${checker.title} has been successfully deleted`,
      })
    },
    onError: (err) => {
      toast({
        status: 'error',
        title: 'An error has occurred',
        description: getApiErrorMessage(err),
      })
    },
  })

  const onDelete = () => onOpen()

  const onDeleteConfirm = () => deleteChecker.mutateAsync(checker.id)

  const onDuplicateClick = () => {
    history.push(`${path}/duplicate/${checker.id}`, { checker })
  }

  const actions = [
    { label: 'Duplicate', icon: <BiDuplicate />, onClick: onDuplicateClick },
    {
      label: 'Delete',
      icon: <BiTrash />,
      onClick: onDelete,
      style: { color: '#FB5D64' },
    },
  ]

  return (
    <>
      <Link to={{ pathname: `/builder/${checker.id}` }}>
        <VStack sx={styles.card} align="stretch" role="group">
          <VStack align="stretch" spacing="8px">
            <Text flex={1} sx={styles.title} noOfLines={3}>
              {checker.title}
            </Text>
            <Text flex={1} sx={styles.subtitle} isTruncated>
              Modified&nbsp;
              {moment(checker.updatedAt)
                .tz('Asia/Singapore')
                .format('DD MMM YYYY')}
            </Text>
          </VStack>
          <Flex direction="row" sx={styles.actions}>
            <StatusIndicator
              status={
                checker.publishedCheckers.length > 0 ? 'published' : 'draft'
              }
            />
            <ActionMenu actions={actions} />
          </Flex>
        </VStack>
      </Link>

      <ConfirmDialog
        isOpen={isOpen}
        onClose={onClose}
        onConfirm={onDeleteConfirm}
        title="Delete checker"
        description="Are you sure? You cannot undo this action afterwards."
      />
    </>
  )
}
