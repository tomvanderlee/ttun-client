import {
  Button,
  Dropdown,
  DropdownButton,
  Form,
  InputGroup,
  ListGroup,
  Offcanvas,
} from "react-bootstrap";
import classNames from "classnames";
import styles from "./RequestList.module.scss";
import RequestSummary from "../RequestSummary/RequestSummary";
import * as React from "react";
import {useCallback, useContext, useMemo, useState} from "react";
import {Method, RequestResponse} from "../../hooks/useRequests";
import {DarkModeContext} from "../../contexts/DarkMode";
import {Filter} from "../Icons/Filter";

interface ListProps {
  requests: RequestResponse[],
  selectedRequestIndex: number | null
  setSelectedRequestIndex: (index: number) => void
}

type EnabledMethods = {
  [method in Method]: boolean
}


export default function RequestList({ requests, selectedRequestIndex, setSelectedRequestIndex }: ListProps) {
  const {darkMode} = useContext(DarkModeContext)
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [search, setSearch] = useState('');
  const [enableRegex, setEnableRegex] = useState(false);

  const [methods, setMethods] = useState<EnabledMethods>({
    GET: true,
    POST: true,
    PUT: true,
    PATCH: true,
    DELETE: true,
  });

  const toggleMethods = useCallback((method: Method | null) => {
    const enabled = method == null;
    const methods = {
      GET: enabled,
      POST: enabled,
      PUT: enabled,
      PATCH: enabled,
      DELETE: enabled,
    }

    if (!enabled) {
      methods[method] = true;
    }

    setMethods(methods);
  }, []);

  const enabledMethods: Method[] = useMemo(() => (Object
      .entries(methods)
      .filter(([method, enabled]) => enabled)
      .map(([method]) => method)
  ), [methods]);

  const methodLabel = useMemo(() => {
    if (enabledMethods.length == 1) {
      return enabledMethods[0]
    } else if (enabledMethods.length === 5) {
      return 'ANY'
    } else {
      return 'CUSTOM'
    }
  }, [enabledMethods]);



  const filteredRequests = useMemo(() => {
    let searchRegex = new RegExp('');
    try {
      searchRegex = new RegExp(
        enableRegex
          ? search
          : search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i');
    } catch {

    }

    return (
      (
        requests
          .map((request, index) => [index, request])
          .reverse() as [number, RequestResponse][]
      )
        .filter(([index, request]) => (
          enabledMethods.length > 0 === null || enabledMethods.includes(request.request.method)
        ))
        .filter(([index, request]) => (
          search === '' || searchRegex.test(`${request.request.method} ${request.request.path}`)
        ))
    )
  }, [requests, search, enabledMethods, enableRegex])

  return (
    <div className={classNames(styles.listContainer, 'd-flex')}>
      <ListGroup variant="flush"
                 className={classNames('flex-grow-0', 'border-bottom')}>
        <ListGroup.Item>
          <InputGroup>
            <DropdownButton variant="primary" title={methodLabel}>
              <Dropdown.Item
                onClick={() => toggleMethods(null)}>ANY</Dropdown.Item>
              <Dropdown.Divider/>
              <Dropdown.Item
                onClick={() => toggleMethods('GET')}>GET</Dropdown.Item>
              <Dropdown.Item
                onClick={() => toggleMethods('POST')}>POST</Dropdown.Item>
              <Dropdown.Item
                onClick={() => toggleMethods('PUT')}>PUT</Dropdown.Item>
              <Dropdown.Item
                onClick={() => toggleMethods('PATCH')}>PATCH</Dropdown.Item>
              <Dropdown.Item
                onClick={() => toggleMethods('DELETE')}>DELETE</Dropdown.Item>
            </DropdownButton>
            <Form.Control type="text" className='border-secondary'
                          value={search} placeholder="Search..."
                          onChange={({target}) => setSearch(target.value)}/>
            <Button
              variant={showFilterOptions ? 'secondary' : 'outline-secondary'}
              onClick={() => setShowFilterOptions(true)}>
              <Filter/>
            </Button>
          </InputGroup>
        </ListGroup.Item>
      </ListGroup>
      <ListGroup
        variant='flush'
        as="ul"
        className={classNames(styles.list, 'flex-grow-1')}
      >
        {
          filteredRequests.length > 0
            ? (
              filteredRequests.map(([index, requestResponse]) => {
                const selected = selectedRequestIndex === index;
                return (
                  <ListGroup.Item
                    as="li"
                    onClick={() => setSelectedRequestIndex(index)}
                    key={`request-${index}`}
                    className={classNames({
                      'bg-primary': selected,
                      'text-light': selected,
                      'border-bottom': true
                    })}
                  >
                    <RequestSummary
                      requestResponse={requestResponse}
                      selected={selected}
                    />
                  </ListGroup.Item>
                )
              })
            )
            : (
              <div className={styles.noRequest}>
                <p>No requests</p>
              </div>
            )
        }
      </ListGroup>
      <Offcanvas className={
        classNames({
          'bg-dark': darkMode
        })
      }
                 show={showFilterOptions}
                 onHide={() => setShowFilterOptions(false)}>
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>
            Filter Options
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Form.Group className="mb-4">
            <Form.Label className="fw-bold">Search</Form.Label>
            <Form.Control type="text" value={search} placeholder="Search..."
                          onChange={({target}) => setSearch(target.value)}/>
            <Form.Check className="mt-2" type='switch' label='Regex search' checked={enableRegex} onChange={() => setEnableRegex(!enableRegex)} />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-bold">Method</Form.Label>
            {Object.entries(methods).map(([method, enabled]) => (
              <Form.Check type='switch' label={method} checked={enabled} onChange={() => setMethods({...methods, [method]: !enabled})} />
            ))}
          </Form.Group>
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  )
}
