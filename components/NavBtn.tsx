interface Props {
    label: string;
    href: string;
    page?: string;
}


const NavBtn = ({label, href, page}: Props) => {
    if (page == label) {
        return (
            <a href={href} className='px-3 py-2 text-white font-medium hover:text-gray-200 transition-colors'>{label}</a>
        )
    }
    return (
        <a href={href} className='px-3 py-2 text-gray-300 hover:text-white font-medium transition-colors'>{label}</a>
    )
}

export default NavBtn