#!/usr/bin/env bash

display_usage() {
	echo "This script checks that the version specified in the VERSION file is appropriate for the current branch"
	echo -e "Usage:\n"
	echo -e "\tcheck_version.sh [OPTIONS] \n"
	echo -e "options:\n"
	echo -e "\t-b, --branch  : string. Branch on which Travis is running the build"
	echo -e "\t-b, --version  : string. Version set for current repository state"
}

# Read parameters
while [[ $# -gt 0 ]]
do
key="$1"
# echo $key
case $key in
    -b|--branch)
    branch="$2"
    shift # past argument
    shift # past value
    ;;
    -v|--version)
    version="$2"
    shift # past argument
    shift # past value
    ;;
    -h|--help)
    shift # past argument
display_usage
    exit 0
    ;;
    *)    # unknown option
    POSITIONAL+=("$1") # save it in an array for later
    shift # past argument
    ;;
esac
done

# Check that both branch and version are set
if [[ $branch == '' ]]; then
    echo "check_version failed: branch is not set."
    exit 1;
fi
if [[ $version == '' ]]; then
    echo "check_version failed: version is not set."
    exit 1;
fi

echo "check_version: branch $branch, version $version"

[[ $branch == 'develop' ]] && { [[ $version == 'SNAPSHOT' ]] && exit 0 || echo "check_version failed: for branch develop version should be SNAPSHOT."; exit 1;}
[[ $branch == 'master' ]] && { [[ $version =~ [0-9]+\.[0-9]+\.[0-9]+\.RELEASE$ ]] && exit 0 || echo "check_version failed: for branch master version should be X.X.X.RELEASE."; exit 1;}
[[ $branch =~ [0-9]+\.[0-9]+\.[0-9]+\.release$ ]] && { [[ $version == ${branch^^} ]] && exit 0 || echo "check_version failed: for release branch $branch version should be ${branch^^}."; exit 1;}
[[ $branch =~ OC-.+$ ]] && { [[ $version == 'SNAPSHOT' ]] && exit 0 || echo "check_version failed: for feature branches version should be SNAPSHOT."; exit 1;}

echo "check_version failed: unhandled branch type"
exit 1;

#TODO Handle PRs and hotfixes

