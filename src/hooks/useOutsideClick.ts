import React, {useEffect} from 'react'

export const useOutsideClick = (
    ref: React.MutableRefObject<any>,
    cb: () => void,
): void => {

    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (
                ref.current !== null &&
                !ref.current.contains(event.target)
            ) {
                cb()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [ref, cb])
}

export const useOutsideButNotOnTargetClick = (
   outsideRef: React.MutableRefObject<any>,
   targetRef: React.MutableRefObject<any>,
    cb: () => void,
): void => {
    useEffect(() => {
        function handleClickOutside(event: MouseEvent): void {
            if (
                outsideRef.current !== null &&
                targetRef.current != null &&
                !outsideRef.current.contains(event.target) &&
                !targetRef.current.contains(event.target)
            ) {
                cb()
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [outsideRef, targetRef, cb])
}
